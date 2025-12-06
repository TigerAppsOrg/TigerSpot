import { prisma } from '../config/database.js';
import type { Bracket, BracketMatch } from '../types/index.js';

export class BracketService {
	/**
	 * Generate double elimination bracket for a tournament
	 */
	async generateBracket(tournamentId: number, participants: string[]) {
		// Shuffle participants for random seeding
		const shuffled = [...participants].sort(() => Math.random() - 0.5);

		// Pad to next power of 2 for proper bracket
		const bracketSize = this.nextPowerOf2(shuffled.length);
		const numByes = bracketSize - shuffled.length;

		// Create proper seeding with byes distributed so they never face each other
		// Standard bracket seeding: 1v8, 4v5, 2v7, 3v6 for 8-player
		// Byes go to top seeds (positions that would face the weakest opponents)
		const seeded: (string | null)[] = new Array(bracketSize).fill(null);

		// Generate standard bracket positions (1 vs bracketSize, 2 vs bracketSize-1, etc.)
		// but with proper bracket ordering for fair matchups
		const bracketPositions = this.generateBracketPositions(bracketSize);

		// Place participants in bracket positions (top seeds get byes)
		for (let i = 0; i < shuffled.length; i++) {
			const position = bracketPositions[i];
			seeded[position] = shuffled[i];
		}

		// Update participant seeds in database
		for (let i = 0; i < shuffled.length; i++) {
			await prisma.tournamentParticipant.updateMany({
				where: {
					tournamentId,
					username: shuffled[i]
				},
				data: { seed: i + 1 }
			});
		}

		// Create winners bracket matches
		const winnersRounds = Math.log2(bracketSize);
		const winnersMatches: number[][] = []; // matchIds by round

		// Create all winners bracket rounds
		for (let round = 0; round < winnersRounds; round++) {
			const matchesInRound = bracketSize / Math.pow(2, round + 1);
			const roundMatches: number[] = [];

			for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
				const match = await prisma.tournamentMatch.create({
					data: {
						tournamentId,
						bracketType: 'WINNERS',
						roundNumber: round + 1,
						matchNumber: matchNum + 1,
						status: round === 0 ? 'READY' : 'PENDING'
					}
				});
				roundMatches.push(match.id);
			}
			winnersMatches.push(roundMatches);
		}

		// Set up first round with players
		const byeWinners: { matchIndex: number; winnerId: string }[] = [];

		for (let i = 0; i < winnersMatches[0].length; i++) {
			const player1 = seeded[i * 2];
			const player2 = seeded[i * 2 + 1];

			await prisma.tournamentMatch.update({
				where: { id: winnersMatches[0][i] },
				data: {
					player1Id: player1,
					player2Id: player2,
					status: player1 && player2 ? 'READY' : 'PENDING'
				}
			});

			// If one player is null (bye), auto-advance the other
			if (!player1 && player2) {
				await prisma.tournamentMatch.update({
					where: { id: winnersMatches[0][i] },
					data: {
						winnerId: player2,
						status: 'COMPLETED'
					}
				});
				byeWinners.push({ matchIndex: i, winnerId: player2 });
			} else if (player1 && !player2) {
				await prisma.tournamentMatch.update({
					where: { id: winnersMatches[0][i] },
					data: {
						winnerId: player1,
						status: 'COMPLETED'
					}
				});
				byeWinners.push({ matchIndex: i, winnerId: player1 });
			}
		}

		// Link winners bracket matches (winner advances to next round)
		for (let round = 0; round < winnersMatches.length - 1; round++) {
			for (let matchNum = 0; matchNum < winnersMatches[round].length; matchNum++) {
				const nextMatchIndex = Math.floor(matchNum / 2);
				await prisma.tournamentMatch.update({
					where: { id: winnersMatches[round][matchNum] },
					data: {
						nextWinnerMatchId: winnersMatches[round + 1][nextMatchIndex]
					}
				});
			}
		}

		// Now advance bye winners to round 2 (after matches are linked)
		for (const { matchIndex, winnerId } of byeWinners) {
			const nextMatchIndex = Math.floor(matchIndex / 2);
			const nextMatchId = winnersMatches[1]?.[nextMatchIndex];

			if (nextMatchId) {
				const nextMatch = await prisma.tournamentMatch.findUnique({
					where: { id: nextMatchId }
				});

				if (nextMatch) {
					// Fill the appropriate slot
					const updateData = !nextMatch.player1Id
						? { player1Id: winnerId }
						: { player2Id: winnerId };

					// Check if this completes the match (both players now assigned)
					const willBeReady =
						(!nextMatch.player1Id && nextMatch.player2Id) ||
						(nextMatch.player1Id && !nextMatch.player2Id);

					await prisma.tournamentMatch.update({
						where: { id: nextMatchId },
						data: {
							...updateData,
							status: willBeReady ? 'READY' : nextMatch.status
						}
					});
				}
			}
		}

		// Create losers bracket (for double elimination)
		// Losers bracket has 2 * (winnersRounds - 1) rounds
		const losersRoundsCount = 2 * (winnersRounds - 1);
		const losersMatches: number[][] = [];

		for (let round = 0; round < losersRoundsCount; round++) {
			// Losers bracket size varies by round
			let matchesInRound: number;
			if (round % 2 === 0) {
				// Drop-down rounds: same as previous winners round
				matchesInRound = bracketSize / Math.pow(2, Math.floor(round / 2) + 2);
			} else {
				// Consolidation rounds: same as previous losers round
				matchesInRound = losersMatches[round - 1]?.length || bracketSize / 4;
			}

			if (matchesInRound < 1) matchesInRound = 1;

			const roundMatches: number[] = [];
			for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
				const match = await prisma.tournamentMatch.create({
					data: {
						tournamentId,
						bracketType: 'LOSERS',
						roundNumber: round + 1,
						matchNumber: matchNum + 1,
						status: 'PENDING'
					}
				});
				roundMatches.push(match.id);
			}
			losersMatches.push(roundMatches);
		}

		// Link losers to losers bracket from winners bracket
		// WR1 (index 0) losers go to LR1 (index 0) - drop round
		// Track which WR1 matches are byes (no loser to send)
		const byeMatchIndices = new Set(byeWinners.map((b) => b.matchIndex));

		for (let i = 0; i < winnersMatches[0].length; i++) {
			if (losersMatches[0]) {
				const loserMatchIndex = Math.floor(i / 2);
				if (losersMatches[0][loserMatchIndex]) {
					await prisma.tournamentMatch.update({
						where: { id: winnersMatches[0][i] },
						data: {
							nextLoserMatchId: losersMatches[0][loserMatchIndex]
						}
					});
				}
			}
		}

		// Handle LR0 matches affected by byes
		// For each LR0 match, check if its feeder WR1 matches are byes
		if (losersMatches[0]) {
			for (let lrMatchIdx = 0; lrMatchIdx < losersMatches[0].length; lrMatchIdx++) {
				const feeder1Idx = lrMatchIdx * 2;
				const feeder2Idx = lrMatchIdx * 2 + 1;
				const feeder1IsBye = byeMatchIndices.has(feeder1Idx);
				const feeder2IsBye = byeMatchIndices.has(feeder2Idx);

				if (feeder1IsBye && feeder2IsBye) {
					// Both feeders are byes - this LR0 match will never have players
					// Mark as completed and auto-advance through losers bracket
					await this.autoAdvanceEmptyLoserMatch(losersMatches[0][lrMatchIdx]);
				}
				// If only one feeder is a bye, we'll handle it in advanceWinner
				// when the actual loser arrives (they'll auto-advance)
			}
		}

		// WR2+ (index n >= 1) losers go to LR index (2n-1) - cross rounds
		// where they face losers bracket survivors
		for (let wRound = 1; wRound < winnersMatches.length; wRound++) {
			const lRoundIndex = 2 * wRound - 1;
			if (losersMatches[lRoundIndex]) {
				for (let i = 0; i < winnersMatches[wRound].length; i++) {
					// Map to corresponding losers match
					const loserMatchIndex = i % losersMatches[lRoundIndex].length;
					if (losersMatches[lRoundIndex][loserMatchIndex]) {
						await prisma.tournamentMatch.update({
							where: { id: winnersMatches[wRound][i] },
							data: {
								nextLoserMatchId: losersMatches[lRoundIndex][loserMatchIndex]
							}
						});
					}
				}
			}
		}

		// Link losers bracket matches internally (winners advance to next round)
		for (let round = 0; round < losersMatches.length - 1; round++) {
			for (let matchNum = 0; matchNum < losersMatches[round].length; matchNum++) {
				// Calculate next match index based on round sizes
				let nextMatchIndex: number;
				if (losersMatches[round + 1].length === losersMatches[round].length) {
					// Same size: 1:1 mapping
					nextMatchIndex = matchNum;
				} else {
					// Consolidation: 2:1 mapping
					nextMatchIndex = Math.floor(matchNum / 2);
				}

				if (losersMatches[round + 1][nextMatchIndex]) {
					await prisma.tournamentMatch.update({
						where: { id: losersMatches[round][matchNum] },
						data: {
							nextWinnerMatchId: losersMatches[round + 1][nextMatchIndex]
						}
					});
				}
			}
		}

		// Create grand final
		const grandFinal = await prisma.tournamentMatch.create({
			data: {
				tournamentId,
				bracketType: 'GRAND_FINAL',
				roundNumber: 1,
				matchNumber: 1,
				status: 'PENDING'
			}
		});

		// Link winners final to grand final
		if (winnersMatches.length > 0) {
			const winnersFinal = winnersMatches[winnersMatches.length - 1][0];
			await prisma.tournamentMatch.update({
				where: { id: winnersFinal },
				data: { nextWinnerMatchId: grandFinal.id }
			});
		}

		// Link losers final to grand final
		if (losersMatches.length > 0) {
			const losersFinal = losersMatches[losersMatches.length - 1][0];
			await prisma.tournamentMatch.update({
				where: { id: losersFinal },
				data: { nextWinnerMatchId: grandFinal.id }
			});
		}

		return { winnersMatches, losersMatches, grandFinalId: grandFinal.id };
	}

	/**
	 * Get bracket structure for a tournament
	 */
	async getBracket(tournamentId: number): Promise<Bracket> {
		const matches = await prisma.tournamentMatch.findMany({
			where: { tournamentId },
			include: {
				player1: { select: { username: true, displayName: true } },
				player2: { select: { username: true, displayName: true } }
			},
			orderBy: [{ roundNumber: 'asc' }, { matchNumber: 'asc' }]
		});

		// Organize into bracket structure
		const winners: BracketMatch[][] = [];
		const losers: BracketMatch[][] = [];
		let grandFinal: BracketMatch | null = null;

		for (const match of matches) {
			const bracketMatch: BracketMatch = {
				id: match.id,
				player1: match.player1Id,
				player1DisplayName: match.player1?.displayName || null,
				player2: match.player2Id,
				player2DisplayName: match.player2?.displayName || null,
				player1Score: match.player1Score,
				player2Score: match.player2Score,
				winnerId: match.winnerId,
				status: match.status.toLowerCase() as BracketMatch['status']
			};

			if (match.bracketType === 'WINNERS') {
				while (winners.length < match.roundNumber) {
					winners.push([]);
				}
				winners[match.roundNumber - 1].push(bracketMatch);
			} else if (match.bracketType === 'LOSERS') {
				while (losers.length < match.roundNumber) {
					losers.push([]);
				}
				losers[match.roundNumber - 1].push(bracketMatch);
			} else if (match.bracketType === 'GRAND_FINAL') {
				grandFinal = bracketMatch;
			}
		}

		return {
			winners,
			losers,
			grandFinal: grandFinal || {
				id: 0,
				player1: null,
				player1DisplayName: null,
				player2: null,
				player2DisplayName: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		};
	}

	/**
	 * Advance winner to next match
	 */
	async advanceWinner(matchId: number, winnerId: string) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId }
		});

		if (!match) return;

		// Update current match
		await prisma.tournamentMatch.update({
			where: { id: matchId },
			data: {
				winnerId,
				status: 'COMPLETED',
				completedAt: new Date()
			}
		});

		// Advance winner to next match
		if (match.nextWinnerMatchId) {
			const nextMatch = await prisma.tournamentMatch.findUnique({
				where: { id: match.nextWinnerMatchId }
			});

			if (nextMatch) {
				// Determine which slot to fill
				const updateData = !nextMatch.player1Id ? { player1Id: winnerId } : { player2Id: winnerId };

				await prisma.tournamentMatch.update({
					where: { id: match.nextWinnerMatchId },
					data: {
						...updateData,
						status: nextMatch.player1Id || nextMatch.player2Id ? 'READY' : 'PENDING'
					}
				});
			}
		}

		// Send loser to losers bracket (if in winners bracket)
		if (match.bracketType === 'WINNERS' && match.nextLoserMatchId) {
			const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;

			if (loserId) {
				const loserMatch = await prisma.tournamentMatch.findUnique({
					where: { id: match.nextLoserMatchId }
				});

				if (loserMatch) {
					const updateData = !loserMatch.player1Id
						? { player1Id: loserId }
						: { player2Id: loserId };

					await prisma.tournamentMatch.update({
						where: { id: match.nextLoserMatchId },
						data: {
							...updateData,
							status: loserMatch.player1Id || loserMatch.player2Id ? 'READY' : 'PENDING'
						}
					});

					// Check if this loser should auto-advance (other feeder was a bye)
					// This happens when only one WR1 match feeds a real loser to an LR0 match
					await this.checkAndAutoAdvanceLoserMatch(match.nextLoserMatchId, match.tournamentId);
				}

				// Update participant loss count
				await prisma.tournamentParticipant.updateMany({
					where: {
						tournamentId: match.tournamentId,
						username: loserId
					},
					data: { lossCount: { increment: 1 } }
				});
			}
		}

		// If loser in losers bracket, they're eliminated
		if (match.bracketType === 'LOSERS') {
			const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;

			if (loserId) {
				await prisma.tournamentParticipant.updateMany({
					where: {
						tournamentId: match.tournamentId,
						username: loserId
					},
					data: {
						eliminated: true,
						lossCount: 2
					}
				});
			}
		}

		// Check if tournament is complete (grand final finished)
		if (match.bracketType === 'GRAND_FINAL') {
			await prisma.tournament.update({
				where: { id: match.tournamentId },
				data: {
					status: 'COMPLETED',
					winnerId,
					completedAt: new Date()
				}
			});
		}
	}

	private nextPowerOf2(n: number): number {
		let power = 1;
		while (power < n) {
			power *= 2;
		}
		return power;
	}

	/**
	 * Generate bracket positions for proper seeding
	 * Returns array where index is seed (0-based) and value is bracket position
	 * Standard bracket seeding ensures:
	 * - 1 vs N, 2 vs N-1, etc. but arranged so 1 and 2 can only meet in finals
	 * - Byes (highest seed numbers) face top seeds, so they auto-advance
	 */
	private generateBracketPositions(bracketSize: number): number[] {
		// Standard bracket seeding algorithm
		// For 8 players: 1v8, 4v5, 3v6, 2v7
		// Positions: [1,8,4,5,3,6,2,7] -> seeds at positions 0-7

		const numRounds = Math.log2(bracketSize);
		const positions: number[] = new Array(bracketSize);

		// Start with seed 1 at position 0
		let seeds = [1];

		// For each round, expand the bracket
		for (let round = 0; round < numRounds; round++) {
			const roundSize = Math.pow(2, round + 1);
			const newSeeds: number[] = [];

			for (const seed of seeds) {
				newSeeds.push(seed);
				newSeeds.push(roundSize + 1 - seed);
			}

			seeds = newSeeds;
		}

		// seeds array now contains the seed at each position
		// Convert to positions array (index = seed-1, value = position)
		for (let pos = 0; pos < bracketSize; pos++) {
			positions[seeds[pos] - 1] = pos;
		}

		return positions;
	}

	/**
	 * Auto-advance through an empty loser match (both feeders were byes)
	 * Marks the match as completed and propagates the "empty" through the bracket
	 */
	private async autoAdvanceEmptyLoserMatch(matchId: number) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId }
		});

		if (!match) return;

		// Mark this match as completed with no players
		await prisma.tournamentMatch.update({
			where: { id: matchId },
			data: { status: 'COMPLETED' }
		});

		// If there's a next match, we need to check if it should also auto-advance
		// This can happen in deeper losers bracket rounds
		if (match.nextWinnerMatchId) {
			await this.checkAndAutoAdvanceLoserMatch(match.nextWinnerMatchId, match.tournamentId);
		}
	}

	/**
	 * Check if a losers bracket match should auto-advance a single player
	 * This happens when one feeder was a bye, leaving only one real player
	 */
	private async checkAndAutoAdvanceLoserMatch(matchId: number, tournamentId: number) {
		const loserMatch = await prisma.tournamentMatch.findUnique({
			where: { id: matchId }
		});

		if (!loserMatch || loserMatch.status === 'COMPLETED') return;

		// Check if all feeder matches that point to this match are completed
		const feederMatches = await prisma.tournamentMatch.findMany({
			where: {
				tournamentId,
				OR: [{ nextLoserMatchId: matchId }, { nextWinnerMatchId: matchId }]
			}
		});

		// If not all feeders are completed, we can't determine yet
		const allFeedersCompleted = feederMatches.every((m) => m.status === 'COMPLETED');
		if (!allFeedersCompleted) return;

		// Re-fetch to get updated player info
		const updatedMatch = await prisma.tournamentMatch.findUnique({
			where: { id: matchId }
		});

		if (!updatedMatch) return;

		// If exactly one player, auto-advance them
		const hasPlayer1 = updatedMatch.player1Id !== null;
		const hasPlayer2 = updatedMatch.player2Id !== null;

		if (hasPlayer1 && !hasPlayer2) {
			// Player 1 auto-advances
			await this.advanceWinner(matchId, updatedMatch.player1Id!);
		} else if (!hasPlayer1 && hasPlayer2) {
			// Player 2 auto-advances
			await this.advanceWinner(matchId, updatedMatch.player2Id!);
		} else if (!hasPlayer1 && !hasPlayer2) {
			// No players - mark as completed and propagate
			await this.autoAdvanceEmptyLoserMatch(matchId);
		}
		// If both players exist, it's a normal match - do nothing
	}
}
