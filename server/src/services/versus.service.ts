import { prisma } from '../config/database.js';
import { ImageService } from './image.service.js';
import { calculateDistance, calculateVersusPoints } from '../utils/distance.js';
import type { ChallengeResponse } from '../types/index.js';

const ROUNDS_PER_MATCH = 5;

export class VersusService {
	private imageService = new ImageService();

	/**
	 * Get available players to challenge
	 */
	async getAvailablePlayers(excludeUsername: string) {
		const users = await prisma.user.findMany({
			where: {
				username: { not: excludeUsername }
			},
			select: {
				username: true,
				displayName: true,
				totalPoints: true
			},
			orderBy: { totalPoints: 'desc' },
			take: 20
		});

		return users;
	}

	/**
	 * Get user's challenges
	 */
	async getChallenges(username: string): Promise<{
		received: ChallengeResponse[];
		sent: ChallengeResponse[];
		active: ChallengeResponse[];
		completed: ChallengeResponse[];
	}> {
		const challenges = await prisma.challenge.findMany({
			where: {
				OR: [{ challengerId: username }, { challengeeId: username }]
			},
			include: {
				challenger: { select: { displayName: true } },
				challengee: { select: { displayName: true } }
			},
			orderBy: { createdAt: 'desc' }
		});

		const formatChallenge = (c: (typeof challenges)[0]): ChallengeResponse => {
			const isChallenger = c.challengerId === username;
			const opponent = isChallenger ? c.challengeeId : c.challengerId;
			const opponentDisplayName = isChallenger
				? c.challengee.displayName
				: c.challenger.displayName;

			return {
				id: c.id,
				opponent,
				opponentDisplayName,
				status: c.status.toLowerCase() as ChallengeResponse['status'],
				isChallenger,
				createdAt: c.createdAt,
				yourScore: isChallenger ? c.challengerPoints : c.challengeePoints,
				theirScore: isChallenger ? c.challengeePoints : c.challengerPoints
			};
		};

		return {
			received: challenges
				.filter((c) => c.challengeeId === username && c.status === 'PENDING')
				.map(formatChallenge),
			sent: challenges
				.filter((c) => c.challengerId === username && c.status === 'PENDING')
				.map(formatChallenge),
			active: challenges
				.filter((c) => c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS')
				.map(formatChallenge),
			completed: challenges
				.filter((c) => c.status === 'COMPLETED')
				.slice(0, 10)
				.map(formatChallenge)
		};
	}

	/**
	 * Create a new challenge
	 */
	async createChallenge(challengerId: string, challengeeId: string) {
		// Check if there's already an active challenge between these users
		const existing = await prisma.challenge.findFirst({
			where: {
				OR: [
					{ challengerId, challengeeId },
					{ challengerId: challengeeId, challengeeId: challengerId }
				],
				status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] }
			}
		});

		if (existing) {
			throw new Error('Active challenge already exists with this player');
		}

		// Get random pictures for the match (filtered by versus mode visibility)
		const pictures = await this.imageService.getRandomPictures(
			ROUNDS_PER_MATCH,
			undefined,
			'versus'
		);

		if (pictures.length < ROUNDS_PER_MATCH) {
			throw new Error('Not enough pictures available');
		}

		// Create challenge
		const challenge = await prisma.challenge.create({
			data: {
				challengerId,
				challengeeId
			},
			include: {
				challenger: { select: { displayName: true } },
				challengee: { select: { displayName: true } }
			}
		});

		// Create round records (one per picture, will duplicate for each player on submit)
		for (let i = 0; i < ROUNDS_PER_MATCH; i++) {
			await prisma.challengeRound.create({
				data: {
					challengeId: challenge.id,
					roundNumber: i + 1,
					pictureId: pictures[i].id
				}
			});
		}

		return challenge;
	}

	/**
	 * Accept a challenge
	 */
	async acceptChallenge(challengeId: number, username: string) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId }
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		if (challenge.challengeeId !== username) {
			throw new Error('You are not the challengee');
		}

		if (challenge.status !== 'PENDING') {
			throw new Error('Challenge is not pending');
		}

		return prisma.challenge.update({
			where: { id: challengeId },
			data: {
				status: 'ACCEPTED',
				startedAt: new Date()
			}
		});
	}

	/**
	 * Decline a challenge
	 */
	async declineChallenge(challengeId: number, username: string) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId }
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		if (challenge.challengeeId !== username) {
			throw new Error('You are not the challengee');
		}

		if (challenge.status !== 'PENDING') {
			throw new Error('Challenge is not pending');
		}

		return prisma.challenge.update({
			where: { id: challengeId },
			data: { status: 'DECLINED' }
		});
	}

	/**
	 * Get round pictures for a challenge
	 */
	async getRounds(challengeId: number) {
		const rounds = await prisma.challengeRound.findMany({
			where: {
				challengeId,
				playerUsername: null // Get the template rounds (no player assigned)
			},
			include: {
				picture: {
					select: {
						id: true,
						imageUrl: true
						// Don't include lat/lng - only reveal after submission
					}
				}
			},
			orderBy: { roundNumber: 'asc' }
		});

		return rounds.map((r) => ({
			roundNumber: r.roundNumber,
			pictureId: r.picture.id,
			imageUrl: r.picture.imageUrl
		}));
	}

	/**
	 * Submit a round guess
	 */
	async submitRound(
		challengeId: number,
		username: string,
		roundNumber: number,
		latitude: number,
		longitude: number,
		timeSeconds: number
	) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId }
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		// Verify user is part of this challenge
		if (challenge.challengerId !== username && challenge.challengeeId !== username) {
			throw new Error('You are not part of this challenge');
		}

		// Get the round template to get the picture
		const templateRound = await prisma.challengeRound.findFirst({
			where: {
				challengeId,
				roundNumber,
				playerUsername: null
			},
			include: { picture: true }
		});

		if (!templateRound) {
			throw new Error('Round not found');
		}

		// Calculate distance and points
		const distance = calculateDistance(
			latitude,
			longitude,
			templateRound.picture.latitude,
			templateRound.picture.longitude
		);
		const points = calculateVersusPoints(distance, timeSeconds);

		// Check if player already submitted this round
		const existing = await prisma.challengeRound.findFirst({
			where: {
				challengeId,
				roundNumber,
				playerUsername: username
			}
		});

		if (existing) {
			throw new Error('Already submitted this round');
		}

		// Create player's round submission
		await prisma.challengeRound.create({
			data: {
				challengeId,
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

		// Update challenge status to IN_PROGRESS if not already
		if (challenge.status === 'ACCEPTED') {
			await prisma.challenge.update({
				where: { id: challengeId },
				data: { status: 'IN_PROGRESS' }
			});
		}

		// Check if this player has finished all rounds
		const playerRounds = await prisma.challengeRound.count({
			where: {
				challengeId,
				playerUsername: username
			}
		});

		if (playerRounds === ROUNDS_PER_MATCH) {
			// Mark player as finished
			const isChallenger = challenge.challengerId === username;
			const totalPoints = await this.calculatePlayerTotal(challengeId, username);

			await prisma.challenge.update({
				where: { id: challengeId },
				data: isChallenger
					? { challengerFinished: true, challengerPoints: totalPoints }
					: { challengeeFinished: true, challengeePoints: totalPoints }
			});

			// Check if both players finished
			const updatedChallenge = await prisma.challenge.findUnique({
				where: { id: challengeId }
			});

			if (updatedChallenge?.challengerFinished && updatedChallenge?.challengeeFinished) {
				// Determine winner
				const winnerId =
					updatedChallenge.challengerPoints > updatedChallenge.challengeePoints
						? updatedChallenge.challengerId
						: updatedChallenge.challengerPoints < updatedChallenge.challengeePoints
							? updatedChallenge.challengeeId
							: null; // Tie

				await prisma.challenge.update({
					where: { id: challengeId },
					data: {
						status: 'COMPLETED',
						winnerId,
						completedAt: new Date()
					}
				});

				// Update user total points
				await prisma.user.update({
					where: { username: updatedChallenge.challengerId },
					data: { totalPoints: { increment: updatedChallenge.challengerPoints } }
				});
				await prisma.user.update({
					where: { username: updatedChallenge.challengeeId },
					data: { totalPoints: { increment: updatedChallenge.challengeePoints } }
				});
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

	private async calculatePlayerTotal(challengeId: number, username: string): Promise<number> {
		const rounds = await prisma.challengeRound.findMany({
			where: {
				challengeId,
				playerUsername: username
			}
		});

		return rounds.reduce((sum, r) => sum + (r.points || 0), 0);
	}

	/**
	 * Get challenge results
	 */
	async getResults(challengeId: number) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId },
			include: {
				challenger: { select: { displayName: true } },
				challengee: { select: { displayName: true } },
				rounds: {
					include: {
						picture: true
					},
					orderBy: [{ roundNumber: 'asc' }, { playerUsername: 'asc' }]
				}
			}
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		return {
			id: challenge.id,
			challenger: {
				username: challenge.challengerId,
				displayName: challenge.challenger.displayName,
				score: challenge.challengerPoints
			},
			challengee: {
				username: challenge.challengeeId,
				displayName: challenge.challengee.displayName,
				score: challenge.challengeePoints
			},
			winner: challenge.winnerId,
			status: challenge.status,
			rounds: challenge.rounds
		};
	}
}
