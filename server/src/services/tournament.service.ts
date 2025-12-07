import { prisma } from '../config/database.js';
import { BracketService } from './bracket.service.js';
import { calculateDistance, calculateVersusPoints } from '../utils/distance.js';
import type { TournamentResponse } from '../types/index.js';

export class TournamentService {
	private bracketService = new BracketService();

	/**
	 * List all tournaments
	 */
	async listTournaments(
		isAdmin: boolean = false,
		username?: string
	): Promise<TournamentResponse[]> {
		const tournaments = await prisma.tournament.findMany({
			include: {
				participants: true,
				winner: { select: { displayName: true } }
			},
			orderBy: { createdAt: 'desc' }
		});

		return tournaments.map((t) => ({
			id: t.id,
			name: t.name,
			status: t.status.toLowerCase() as TournamentResponse['status'],
			difficulty: 'mixed' as TournamentResponse['difficulty'], // Tournaments use mixed difficulty
			timeLimit: t.timeLimit,
			roundsPerMatch: t.roundsPerMatch,
			participants: t.participants.length,
			maxParticipants: t.maxParticipants,
			createdAt: t.createdAt,
			winner: t.winner?.displayName,
			...(isAdmin ? { joinCode: t.joinCode } : {}),
			...(username ? { joined: t.participants.some((p) => p.username === username) } : {})
		}));
	}

	/**
	 * Get tournament details
	 */
	async getTournament(id: number) {
		const tournament = await prisma.tournament.findUnique({
			where: { id },
			include: {
				participants: {
					include: {
						user: { select: { displayName: true } }
					}
				},
				creator: { select: { displayName: true } },
				winner: { select: { displayName: true } }
			}
		});

		if (!tournament) {
			return null;
		}

		const bracket = await this.bracketService.getBracket(id);

		return {
			id: tournament.id,
			name: tournament.name,
			status: tournament.status.toLowerCase(),
			difficulty: 'mixed', // Tournaments use mixed difficulty that escalates through stages
			timeLimit: tournament.timeLimit,
			roundsPerMatch: tournament.roundsPerMatch,
			maxParticipants: tournament.maxParticipants,
			createdBy: tournament.creator.displayName,
			createdAt: tournament.createdAt,
			startedAt: tournament.startedAt,
			completedAt: tournament.completedAt,
			winner: tournament.winner?.displayName,
			participants: tournament.participants.map((p) => ({
				username: p.username,
				displayName: p.user.displayName,
				seed: p.seed,
				eliminated: p.eliminated,
				lossCount: p.lossCount
			})),
			bracket
		};
	}

	/**
	 * Join a tournament
	 */
	async joinTournament(tournamentId: number, username: string, joinCode: string) {
		const tournament = await prisma.tournament.findUnique({
			where: { id: tournamentId },
			include: { participants: true }
		});

		if (!tournament) {
			throw new Error('Tournament not found');
		}

		if (tournament.status !== 'OPEN') {
			throw new Error('Tournament is not open for registration');
		}

		// Validate join code (case-insensitive)
		if (tournament.joinCode.toUpperCase() !== joinCode.toUpperCase()) {
			throw new Error('Invalid join code');
		}

		if (
			tournament.maxParticipants !== null &&
			tournament.participants.length >= tournament.maxParticipants
		) {
			throw new Error('Tournament is full');
		}

		// Check if already joined
		const existing = tournament.participants.find((p) => p.username === username);
		if (existing) {
			throw new Error('Already joined this tournament');
		}

		return prisma.tournamentParticipant.create({
			data: {
				tournamentId,
				username
			}
		});
	}

	/**
	 * Leave a tournament
	 */
	async leaveTournament(tournamentId: number, username: string) {
		const tournament = await prisma.tournament.findUnique({
			where: { id: tournamentId }
		});

		if (!tournament) {
			throw new Error('Tournament not found');
		}

		if (tournament.status !== 'OPEN') {
			throw new Error('Cannot leave a tournament that has already started');
		}

		return prisma.tournamentParticipant.deleteMany({
			where: {
				tournamentId,
				username
			}
		});
	}

	/**
	 * Get match details
	 */
	async getMatch(matchId: number) {
		return prisma.tournamentMatch.findUnique({
			where: { id: matchId },
			include: {
				player1: { select: { displayName: true } },
				player2: { select: { displayName: true } },
				tournament: {
					select: { timeLimit: true, roundsPerMatch: true }
				},
				rounds: {
					include: {
						picture: true
					}
				}
			}
		});
	}

	/**
	 * Get round pictures for a match
	 * Uses pre-selected pictures from TournamentBracketRound
	 * All matches in the same bracket round share the same pictures
	 */
	async getMatchRounds(matchId: number) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId },
			include: {
				tournament: { select: { id: true, roundsPerMatch: true } }
			}
		});

		if (!match) {
			throw new Error('Match not found');
		}

		// Check if rounds already generated for this match
		const existingRounds = await prisma.tournamentRound.findMany({
			where: {
				matchId,
				playerUsername: null // Template rounds
			},
			include: {
				picture: {
					select: { id: true, imageUrl: true }
				}
			},
			orderBy: { roundNumber: 'asc' }
		});

		if (existingRounds.length === match.tournament.roundsPerMatch) {
			return existingRounds.map((r) => ({
				roundNumber: r.roundNumber,
				pictureId: r.picture.id,
				imageUrl: r.picture.imageUrl
			}));
		}

		// Get pre-selected pictures for this bracket round
		// All matches in the same (bracketType, roundNumber) share these pictures
		const bracketRoundPictures = await prisma.tournamentBracketRound.findMany({
			where: {
				tournamentId: match.tournament.id,
				bracketType: match.bracketType,
				roundNumber: match.roundNumber
			},
			include: {
				picture: { select: { id: true, imageUrl: true } }
			},
			orderBy: { pictureIndex: 'asc' }
		});

		if (bracketRoundPictures.length < match.tournament.roundsPerMatch) {
			throw new Error('Pre-selected pictures not found for this bracket round');
		}

		// Create TournamentRound records for this match using the pre-selected pictures
		const rounds = [];
		for (let i = 0; i < match.tournament.roundsPerMatch; i++) {
			const round = await prisma.tournamentRound.create({
				data: {
					matchId,
					roundNumber: i + 1,
					pictureId: bracketRoundPictures[i].pictureId
				},
				include: {
					picture: { select: { id: true, imageUrl: true } }
				}
			});

			rounds.push({
				roundNumber: round.roundNumber,
				pictureId: round.picture.id,
				imageUrl: round.picture.imageUrl
			});
		}

		return rounds;
	}

	/**
	 * Submit a round guess for tournament match
	 */
	async submitRound(
		matchId: number,
		username: string,
		roundNumber: number,
		latitude: number,
		longitude: number,
		timeSeconds: number
	) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId },
			include: { tournament: true }
		});

		if (!match) {
			throw new Error('Match not found');
		}

		if (match.player1Id !== username && match.player2Id !== username) {
			throw new Error('You are not part of this match');
		}

		// Get the round template
		const templateRound = await prisma.tournamentRound.findFirst({
			where: {
				matchId,
				roundNumber,
				playerUsername: null
			},
			include: { picture: true }
		});

		if (!templateRound) {
			throw new Error('Round not found');
		}

		// Calculate score
		const distance = calculateDistance(
			latitude,
			longitude,
			templateRound.picture.latitude,
			templateRound.picture.longitude
		);
		const points = calculateVersusPoints(distance, timeSeconds);

		// Check if already submitted
		const existing = await prisma.tournamentRound.findFirst({
			where: {
				matchId,
				roundNumber,
				playerUsername: username
			}
		});

		if (existing) {
			throw new Error('Already submitted this round');
		}

		// Create submission
		await prisma.tournamentRound.create({
			data: {
				matchId,
				roundNumber,
				pictureId: templateRound.pictureId,
				playerUsername: username,
				guessLat: latitude,
				guessLng: longitude,
				distance: Math.round(distance),
				points,
				timeSeconds,
				submittedAt: new Date()
			}
		});

		// Update match status
		if (match.status === 'READY') {
			await prisma.tournamentMatch.update({
				where: { id: matchId },
				data: { status: 'IN_PROGRESS', startedAt: new Date() }
			});
		}

		// Check if both players finished all rounds
		const player1Rounds = await prisma.tournamentRound.count({
			where: { matchId, playerUsername: match.player1Id }
		});
		const player2Rounds = await prisma.tournamentRound.count({
			where: { matchId, playerUsername: match.player2Id }
		});

		if (
			player1Rounds === match.tournament.roundsPerMatch &&
			player2Rounds === match.tournament.roundsPerMatch
		) {
			// Calculate totals
			const player1Total = await this.calculatePlayerTotal(matchId, match.player1Id!);
			const player2Total = await this.calculatePlayerTotal(matchId, match.player2Id!);

			// Determine winner
			const winnerId =
				player1Total > player2Total
					? match.player1Id
					: player1Total < player2Total
						? match.player2Id
						: null; // Tie - rare, handle as needed

			// Update match
			await prisma.tournamentMatch.update({
				where: { id: matchId },
				data: {
					player1Score: player1Total,
					player2Score: player2Total,
					winnerId,
					status: 'COMPLETED',
					completedAt: new Date()
				}
			});

			// Advance winner in bracket
			if (winnerId) {
				await this.bracketService.advanceWinner(matchId, winnerId);
			}
		}

		return {
			roundNumber,
			distance: Math.round(distance),
			points,
			actualLat: templateRound.picture.latitude,
			actualLng: templateRound.picture.longitude
		};
	}

	private async calculatePlayerTotal(matchId: number, username: string): Promise<number> {
		const rounds = await prisma.tournamentRound.findMany({
			where: {
				matchId,
				playerUsername: username
			}
		});

		return rounds.reduce((sum, r) => sum + (r.points || 0), 0);
	}

	/**
	 * Get match results with both players' scores
	 */
	async getMatchResults(matchId: number, username: string) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId },
			include: {
				tournament: { select: { id: true, roundsPerMatch: true } },
				player1: { select: { username: true, displayName: true } },
				player2: { select: { username: true, displayName: true } },
				rounds: {
					where: { playerUsername: { not: null } },
					orderBy: [{ roundNumber: 'asc' }, { playerUsername: 'asc' }]
				}
			}
		});

		if (!match) {
			throw new Error('Match not found');
		}

		// Determine which player is "you" and which is "opponent"
		const isPlayer1 = match.player1Id === username;
		const you = isPlayer1 ? match.player1 : match.player2;
		const opponent = isPlayer1 ? match.player2 : match.player1;
		const yourId = isPlayer1 ? match.player1Id : match.player2Id;
		const opponentId = isPlayer1 ? match.player2Id : match.player1Id;

		// Get round scores for each player
		const yourRounds = match.rounds
			.filter((r) => r.playerUsername === yourId)
			.sort((a, b) => a.roundNumber - b.roundNumber);
		const opponentRounds = match.rounds
			.filter((r) => r.playerUsername === opponentId)
			.sort((a, b) => a.roundNumber - b.roundNumber);

		const yourScores = yourRounds.map((r) => r.points || 0);
		const opponentScores = opponentRounds.map((r) => r.points || 0);
		const yourTotal = yourScores.reduce((a, b) => a + b, 0);
		const opponentTotal = opponentScores.reduce((a, b) => a + b, 0);

		// Check completion status
		const yourFinished = yourRounds.length === match.tournament.roundsPerMatch;
		const opponentFinished = opponentRounds.length === match.tournament.roundsPerMatch;

		return {
			matchId: match.id,
			tournamentId: match.tournament.id,
			status: match.status,
			you: {
				username: you?.username || '',
				displayName: you?.displayName || 'Unknown',
				scores: yourScores,
				total: yourTotal,
				finished: yourFinished
			},
			opponent: {
				username: opponent?.username || '',
				displayName: opponent?.displayName || 'Unknown',
				scores: opponentScores,
				total: opponentTotal,
				finished: opponentFinished
			},
			winnerId: match.winnerId,
			completedAt: match.completedAt
		};
	}

	/**
	 * Get match status (for polling or socket updates)
	 */
	async getMatchStatus(matchId: number) {
		const match = await prisma.tournamentMatch.findUnique({
			where: { id: matchId },
			include: {
				tournament: { select: { roundsPerMatch: true } },
				rounds: {
					where: { playerUsername: { not: null } },
					select: { playerUsername: true, roundNumber: true }
				}
			}
		});

		if (!match) return null;

		const player1Rounds = match.rounds.filter((r) => r.playerUsername === match.player1Id).length;
		const player2Rounds = match.rounds.filter((r) => r.playerUsername === match.player2Id).length;

		return {
			matchId: match.id,
			status: match.status,
			player1Id: match.player1Id,
			player2Id: match.player2Id,
			player1Progress: player1Rounds,
			player2Progress: player2Rounds,
			totalRounds: match.tournament.roundsPerMatch,
			player1Finished: player1Rounds === match.tournament.roundsPerMatch,
			player2Finished: player2Rounds === match.tournament.roundsPerMatch,
			winnerId: match.winnerId
		};
	}
}
