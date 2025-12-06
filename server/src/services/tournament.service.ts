import { prisma } from '../config/database.js';
import { BracketService } from './bracket.service.js';
import { ImageService, type GameMode } from './image.service.js';
import { calculateDistance, calculateVersusPoints } from '../utils/distance.js';
import type { TournamentResponse } from '../types/index.js';
import type { BracketType, Difficulty } from '@prisma/client';

interface DifficultyDistribution {
	EASY: number;
	MEDIUM: number;
	HARD: number;
}

export class TournamentService {
	private bracketService = new BracketService();
	private imageService = new ImageService();

	/**
	 * List all tournaments
	 */
	async listTournaments(): Promise<TournamentResponse[]> {
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
			winner: t.winner?.displayName
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
	async joinTournament(tournamentId: number, username: string) {
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
	 * Uses mixed difficulty that escalates through tournament stages
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

		// Check if rounds already generated
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

		// Calculate bracket info to determine difficulty distribution
		const bracketInfo = await this.getBracketInfo(match.tournament.id);

		// Calculate difficulty distribution based on match position in bracket
		const distribution = this.calculateDifficultyDistribution(
			match.bracketType,
			match.roundNumber,
			bracketInfo.totalWinnersRounds,
			bracketInfo.totalLosersRounds
		);

		// Get pictures with mixed difficulty distribution
		const pictures = await this.getPicturesWithDistribution(
			match.tournament.roundsPerMatch,
			distribution
		);

		if (pictures.length < match.tournament.roundsPerMatch) {
			throw new Error('Not enough pictures available for the required difficulty distribution');
		}

		const rounds = [];
		for (let i = 0; i < match.tournament.roundsPerMatch; i++) {
			const round = await prisma.tournamentRound.create({
				data: {
					matchId,
					roundNumber: i + 1,
					pictureId: pictures[i].id
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
	 * Get bracket structure info for a tournament
	 */
	private async getBracketInfo(tournamentId: number): Promise<{
		totalWinnersRounds: number;
		totalLosersRounds: number;
	}> {
		const matches = await prisma.tournamentMatch.findMany({
			where: { tournamentId },
			select: { bracketType: true, roundNumber: true }
		});

		const winnersRounds = matches
			.filter((m) => m.bracketType === 'WINNERS')
			.map((m) => m.roundNumber);
		const losersRounds = matches
			.filter((m) => m.bracketType === 'LOSERS')
			.map((m) => m.roundNumber);

		return {
			totalWinnersRounds: winnersRounds.length > 0 ? Math.max(...winnersRounds) : 1,
			totalLosersRounds: losersRounds.length > 0 ? Math.max(...losersRounds) : 1
		};
	}

	/**
	 * Calculate difficulty distribution based on bracket position
	 * Early rounds: 80% Easy, 20% Medium
	 * Mid-early rounds: 40% Easy, 50% Medium, 10% Hard
	 * Mid-late rounds: 10% Easy, 50% Medium, 40% Hard
	 * Late rounds: 20% Medium, 80% Hard
	 * Grand Final: 100% Hard
	 */
	private calculateDifficultyDistribution(
		bracketType: BracketType,
		roundNumber: number,
		totalWinnersRounds: number,
		totalLosersRounds: number
	): DifficultyDistribution {
		// Grand Final: 100% HARD
		if (bracketType === 'GRAND_FINAL') {
			return { EASY: 0, MEDIUM: 0, HARD: 100 };
		}

		// Calculate progress through the bracket (0 to 1)
		let progress: number;

		if (bracketType === 'WINNERS') {
			progress = (roundNumber - 1) / Math.max(1, totalWinnersRounds - 1);
		} else {
			// LOSERS bracket
			progress = (roundNumber - 1) / Math.max(1, totalLosersRounds - 1);
		}

		// Apply difficulty curve based on progress
		if (progress <= 0.25) {
			// Early rounds: mostly easy
			return { EASY: 80, MEDIUM: 20, HARD: 0 };
		} else if (progress <= 0.5) {
			// Mid-early rounds: transitioning
			return { EASY: 40, MEDIUM: 50, HARD: 10 };
		} else if (progress <= 0.75) {
			// Mid-late rounds: getting harder
			return { EASY: 10, MEDIUM: 50, HARD: 40 };
		} else {
			// Late rounds: mostly hard
			return { EASY: 0, MEDIUM: 20, HARD: 80 };
		}
	}

	/**
	 * Select pictures based on difficulty distribution
	 */
	private async getPicturesWithDistribution(
		count: number,
		distribution: DifficultyDistribution
	): Promise<{ id: number; imageUrl: string }[]> {
		const result: { id: number; imageUrl: string }[] = [];

		// Calculate how many of each difficulty to fetch
		const easyCount = Math.round((count * distribution.EASY) / 100);
		const mediumCount = Math.round((count * distribution.MEDIUM) / 100);
		const hardCount = count - easyCount - mediumCount; // Remaining for hard

		// Fetch pictures of each difficulty (filtered by tournament visibility)
		if (easyCount > 0) {
			const easyPics = await this.imageService.getRandomPictures(easyCount, 'EASY', 'tournament');
			result.push(...easyPics.map((p) => ({ id: p.id, imageUrl: p.imageUrl })));
		}
		if (mediumCount > 0) {
			const mediumPics = await this.imageService.getRandomPictures(
				mediumCount,
				'MEDIUM',
				'tournament'
			);
			result.push(...mediumPics.map((p) => ({ id: p.id, imageUrl: p.imageUrl })));
		}
		if (hardCount > 0) {
			const hardPics = await this.imageService.getRandomPictures(hardCount, 'HARD', 'tournament');
			result.push(...hardPics.map((p) => ({ id: p.id, imageUrl: p.imageUrl })));
		}

		// Shuffle the combined results so difficulties are mixed
		return result.sort(() => Math.random() - 0.5);
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
}
