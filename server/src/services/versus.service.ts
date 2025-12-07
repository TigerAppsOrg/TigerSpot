import { prisma } from '../config/database.js';
import { ImageService } from './image.service.js';
import { calculateDistance, calculateVersusPoints } from '../utils/distance.js';
import type { ChallengeResponse } from '../types/index.js';

const ROUNDS_PER_MATCH = 5;
const PRESENCE_TIMEOUT_SECONDS = 30; // Users are "online" if seen within this time
const CHALLENGE_EXPIRY_MINUTES = 2; // Pending challenges expire after this time

export class VersusService {
	private imageService = new ImageService();

	/**
	 * Update user's presence on versus page (heartbeat)
	 */
	async updatePresence(username: string) {
		await prisma.user.update({
			where: { username },
			data: { lastSeenVersus: new Date() }
		});
	}

	/**
	 * Get available players to challenge (only those currently on versus page)
	 */
	async getAvailablePlayers(excludeUsername: string) {
		const cutoffTime = new Date(Date.now() - PRESENCE_TIMEOUT_SECONDS * 1000);

		const users = await prisma.user.findMany({
			where: {
				username: { not: excludeUsername },
				lastSeenVersus: { gte: cutoffTime }
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
		// First, expire old pending challenges
		const expiryTime = new Date(Date.now() - CHALLENGE_EXPIRY_MINUTES * 60 * 1000);
		await prisma.challenge.updateMany({
			where: {
				status: 'PENDING',
				createdAt: { lt: expiryTime }
			},
			data: { status: 'DECLINED' } // Mark expired as declined
		});

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
	 * Cancel a sent challenge
	 */
	async cancelChallenge(challengeId: number, username: string) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId }
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		if (challenge.challengerId !== username) {
			throw new Error('You can only cancel challenges you sent');
		}

		if (challenge.status !== 'PENDING') {
			throw new Error('Can only cancel pending challenges');
		}

		// Delete the challenge and its rounds
		await prisma.challengeRound.deleteMany({
			where: { challengeId }
		});

		await prisma.challenge.delete({
			where: { id: challengeId }
		});

		return { success: true };
	}

	/**
	 * Create a new challenge
	 */
	async createChallenge(challengerId: string, challengeeId: string): Promise<ChallengeResponse> {
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

		// Return formatted response matching ChallengeResponse type
		return {
			id: challenge.id,
			opponent: challengeeId,
			opponentDisplayName: challenge.challengee.displayName,
			status: 'pending',
			isChallenger: true,
			createdAt: challenge.createdAt,
			yourScore: 0,
			theirScore: 0
		};
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
	 * Get challenge status (for polling opponent progress)
	 */
	async getStatus(challengeId: number, username: string) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId }
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		// Get round counts for each player
		const challengerRounds = await prisma.challengeRound.count({
			where: { challengeId, playerUsername: challenge.challengerId }
		});
		const challengeeRounds = await prisma.challengeRound.count({
			where: { challengeId, playerUsername: challenge.challengeeId }
		});

		const isChallenger = challenge.challengerId === username;

		return {
			challengeId: challenge.id,
			status: challenge.status,
			challengerId: challenge.challengerId,
			challengeeId: challenge.challengeeId,
			yourProgress: isChallenger ? challengerRounds : challengeeRounds,
			opponentProgress: isChallenger ? challengeeRounds : challengerRounds,
			totalRounds: ROUNDS_PER_MATCH,
			yourFinished: isChallenger ? challenge.challengerFinished : challenge.challengeeFinished,
			opponentFinished: isChallenger ? challenge.challengeeFinished : challenge.challengerFinished,
			winnerId: challenge.winnerId
		};
	}

	/**
	 * Get challenge results (formatted like tournament results)
	 */
	async getResults(challengeId: number, username: string) {
		const challenge = await prisma.challenge.findUnique({
			where: { id: challengeId },
			include: {
				challenger: { select: { username: true, displayName: true } },
				challengee: { select: { username: true, displayName: true } },
				rounds: {
					include: {
						picture: {
							select: { id: true, imageUrl: true, latitude: true, longitude: true }
						}
					},
					orderBy: [{ roundNumber: 'asc' }, { playerUsername: 'asc' }]
				}
			}
		});

		if (!challenge) {
			throw new Error('Challenge not found');
		}

		// Determine which player is "you" and which is "opponent"
		const isChallenger = challenge.challengerId === username;
		const you = isChallenger ? challenge.challenger : challenge.challengee;
		const opponent = isChallenger ? challenge.challengee : challenge.challenger;
		const yourId = isChallenger ? challenge.challengerId : challenge.challengeeId;
		const opponentId = isChallenger ? challenge.challengeeId : challenge.challengerId;

		// Get round scores for each player
		const yourRounds = challenge.rounds
			.filter((r) => r.playerUsername === yourId && r.submittedAt !== null)
			.sort((a, b) => a.roundNumber - b.roundNumber);
		const opponentRounds = challenge.rounds
			.filter((r) => r.playerUsername === opponentId && r.submittedAt !== null)
			.sort((a, b) => a.roundNumber - b.roundNumber);

		// Get template rounds (for picture info)
		const templateRounds = challenge.rounds
			.filter((r) => r.playerUsername === null)
			.sort((a, b) => a.roundNumber - b.roundNumber);

		const yourScores = yourRounds.map((r) => r.points || 0);
		const opponentScores = opponentRounds.map((r) => r.points || 0);
		const yourTotal = yourScores.reduce((a, b) => a + b, 0);
		const opponentTotal = opponentScores.reduce((a, b) => a + b, 0);

		// Calculate total times
		const yourTotalTime = yourRounds.reduce((sum, r) => sum + (r.timeSeconds || 0), 0);
		const opponentTotalTime = opponentRounds.reduce((sum, r) => sum + (r.timeSeconds || 0), 0);

		const yourFinished = yourRounds.length === ROUNDS_PER_MATCH;
		const opponentFinished = opponentRounds.length === ROUNDS_PER_MATCH;

		// Determine if tiebreaker was used
		const tiebreaker = yourTotal === opponentTotal && challenge.winnerId ? 'time' : null;

		// Build detailed round info for review
		const rounds = templateRounds.map((template) => {
			const yourRound = yourRounds.find((r) => r.roundNumber === template.roundNumber);
			const opponentRound = opponentRounds.find((r) => r.roundNumber === template.roundNumber);

			return {
				roundNumber: template.roundNumber,
				imageUrl: template.picture.imageUrl,
				actual: {
					lat: template.picture.latitude,
					lng: template.picture.longitude
				},
				you: yourRound
					? {
							guess: { lat: yourRound.guessLat!, lng: yourRound.guessLng! },
							distance: yourRound.distance || 0,
							points: yourRound.points || 0,
							time: yourRound.timeSeconds || 0
						}
					: null,
				opponent: opponentRound
					? {
							guess: { lat: opponentRound.guessLat!, lng: opponentRound.guessLng! },
							distance: opponentRound.distance || 0,
							points: opponentRound.points || 0,
							time: opponentRound.timeSeconds || 0
						}
					: null
			};
		});

		return {
			challengeId: challenge.id,
			status: challenge.status,
			tiebreaker,
			rounds,
			you: {
				username: you.username,
				displayName: you.displayName,
				scores: yourScores,
				total: yourTotal,
				totalTime: yourTotalTime,
				finished: yourFinished
			},
			opponent: {
				username: opponent.username,
				displayName: opponent.displayName,
				scores: opponentScores,
				total: opponentTotal,
				totalTime: opponentTotalTime,
				finished: opponentFinished
			},
			winnerId: challenge.winnerId,
			completedAt: challenge.completedAt?.toISOString() || null
		};
	}
}
