import { prisma } from '../config/database.js';
import { calculateDistance, calculateDailyPoints } from '../utils/distance.js';

export class DailyService {
	/**
	 * Get today's challenge picture
	 */
	async getTodayChallenge() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let dailyChallenge = await prisma.dailyChallenge.findUnique({
			where: { date: today },
			include: { picture: true }
		});

		// If no challenge set for today, pick a picture using smart selection
		if (!dailyChallenge) {
			const selectedPicture = await this.selectDailyPicture();
			if (!selectedPicture) {
				return null;
			}

			dailyChallenge = await prisma.dailyChallenge.create({
				data: {
					date: today,
					pictureId: selectedPicture.id
				},
				include: { picture: true }
			});

			// Mark the picture as used
			await prisma.picture.update({
				where: { id: selectedPicture.id },
				data: { usedInDaily: true }
			});
		}

		return {
			id: dailyChallenge.picture.id,
			imageUrl: dailyChallenge.picture.imageUrl
			// Don't expose actual coordinates until after submission
		};
	}

	/**
	 * Smart selection of daily picture:
	 * 1. First try to pick from unused pictures (usedInDaily: false)
	 * 2. If all pictures have been used, reset usedInDaily and exclude last 21 days
	 */
	private async selectDailyPicture() {
		// First, try to get an unused picture
		const unusedPictures = await prisma.picture.findMany({
			where: {
				showInDaily: true,
				usedInDaily: false
			}
		});

		if (unusedPictures.length > 0) {
			// Pick random from unused pictures
			return unusedPictures[Math.floor(Math.random() * unusedPictures.length)];
		}

		// All pictures have been used - reset the usedInDaily flag for all
		await prisma.picture.updateMany({
			where: { showInDaily: true },
			data: { usedInDaily: false }
		});

		// Get picture IDs used in the last 21 days to exclude them
		const twentyOneDaysAgo = new Date();
		twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
		twentyOneDaysAgo.setHours(0, 0, 0, 0);

		const recentChallenges = await prisma.dailyChallenge.findMany({
			where: {
				date: { gte: twentyOneDaysAgo }
			},
			select: { pictureId: true }
		});

		const recentPictureIds = recentChallenges.map((c) => c.pictureId);

		// Get pictures excluding recent ones
		const availablePictures = await prisma.picture.findMany({
			where: {
				showInDaily: true,
				id: { notIn: recentPictureIds.length > 0 ? recentPictureIds : [-1] }
			}
		});

		if (availablePictures.length > 0) {
			return availablePictures[Math.floor(Math.random() * availablePictures.length)];
		}

		// Fallback: if somehow all pictures were used in last 21 days (very small pool),
		// just pick the oldest one from recent challenges
		const allPictures = await prisma.picture.findMany({
			where: { showInDaily: true }
		});

		if (allPictures.length === 0) {
			return null;
		}

		return allPictures[Math.floor(Math.random() * allPictures.length)];
	}

	/**
	 * Start today's challenge - records server-side start time (anti-cheat)
	 * Returns elapsed/remaining seconds if already started
	 */
	async startChallenge(
		username: string,
		timeLimit: number = 120
	): Promise<{ startedAt: Date; elapsedSeconds: number; remainingSeconds: number }> {
		// Check if user has already played
		const hasPlayed = await this.hasPlayedToday(username);
		if (hasPlayed) {
			// Already submitted - no time remaining
			return {
				startedAt: new Date(),
				elapsedSeconds: timeLimit,
				remainingSeconds: 0
			};
		}

		// Get or create UserDaily record
		let userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		if (userDaily?.startedAt) {
			// Check if startedAt is from today
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const startedDate = new Date(userDaily.startedAt);
			startedDate.setHours(0, 0, 0, 0);

			if (startedDate.getTime() === today.getTime()) {
				// Already started today - calculate elapsed time
				const elapsedMs = Date.now() - userDaily.startedAt.getTime();
				const elapsedSeconds = Math.floor(elapsedMs / 1000);
				const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);
				return { startedAt: userDaily.startedAt, elapsedSeconds, remainingSeconds };
			}
		}

		// Start new challenge
		const now = new Date();
		await prisma.userDaily.upsert({
			where: { username },
			update: { startedAt: now },
			create: {
				username,
				startedAt: now
			}
		});

		return { startedAt: now, elapsedSeconds: 0, remainingSeconds: timeLimit };
	}

	/**
	 * Check if user has played today's challenge
	 */
	async hasPlayedToday(username: string): Promise<boolean> {
		const userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		if (!userDaily) {
			return false;
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Check if played today (normal submission)
		if (userDaily.lastPlayed) {
			const lastPlayed = new Date(userDaily.lastPlayed);
			lastPlayed.setHours(0, 0, 0, 0);
			if (lastPlayed.getTime() === today.getTime()) {
				return true;
			}
		}

		// Check if timed out today (startedAt is today and guessLat is null)
		// This handles the case where user timed out but we didn't set lastPlayed
		if (userDaily.startedAt && userDaily.guessLat === null) {
			const startedAt = new Date(userDaily.startedAt);
			startedAt.setHours(0, 0, 0, 0);
			if (startedAt.getTime() === today.getTime()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Submit a guess for today's challenge
	 * @param timedOut - If true, user timed out without guessing. This won't affect streak.
	 */
	async submitGuess(
		username: string,
		guessLat: number,
		guessLng: number,
		timedOut: boolean = false
	): Promise<{
		success: boolean;
		error?: string;
		result?: {
			guessLat: number | null;
			guessLng: number | null;
			actualLat: number;
			actualLng: number;
			distance: number;
			points: number;
			timedOut: boolean;
		};
	}> {
		// Check if already played today
		const hasPlayed = await this.hasPlayedToday(username);
		if (hasPlayed) {
			return { success: false, error: 'Already played today' };
		}

		// Get today's challenge
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const dailyChallenge = await prisma.dailyChallenge.findUnique({
			where: { date: today },
			include: { picture: true }
		});

		if (!dailyChallenge) {
			return { success: false, error: 'No challenge available today' };
		}

		const picture = dailyChallenge.picture;

		// Handle timeout - mark as played but don't affect streak
		if (timedOut) {
			await prisma.userDaily.upsert({
				where: { username },
				update: {
					played: true,
					distance: 0,
					// Don't update lastPlayed - streak stays frozen
					// Don't update points/currentStreak/maxStreak
					guessLat: null,
					guessLng: null
				},
				create: {
					username,
					played: true,
					distance: 0
					// Don't set lastPlayed, currentStreak, maxStreak - they stay at defaults
				}
			});

			return {
				success: true,
				result: {
					guessLat: null,
					guessLng: null,
					actualLat: picture.latitude,
					actualLng: picture.longitude,
					distance: 0,
					points: 0,
					timedOut: true
				}
			};
		}

		// Normal submission - calculate distance and points
		const distance = calculateDistance(guessLat, guessLng, picture.latitude, picture.longitude);
		const points = calculateDailyPoints(distance);

		// Update user's daily record and streak
		const userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		let newStreak = 1;
		if (userDaily?.lastPlayed) {
			const lastPlayedDate = new Date(userDaily.lastPlayed);
			lastPlayedDate.setHours(0, 0, 0, 0);

			if (lastPlayedDate.getTime() === yesterday.getTime()) {
				// Played yesterday, continue streak
				newStreak = (userDaily.currentStreak || 0) + 1;
			}
		}

		// Update UserDaily
		await prisma.userDaily.upsert({
			where: { username },
			update: {
				points: { increment: points },
				distance: Math.round(distance),
				played: true,
				lastPlayed: new Date(),
				currentStreak: newStreak,
				maxStreak: userDaily ? Math.max(userDaily.maxStreak, newStreak) : newStreak,
				guessLat,
				guessLng
			},
			create: {
				username,
				points,
				distance: Math.round(distance),
				played: true,
				lastPlayed: new Date(),
				currentStreak: 1,
				maxStreak: 1,
				guessLat,
				guessLng
			}
		});

		// Update total points
		await prisma.user.update({
			where: { username },
			data: {
				totalPoints: { increment: points }
			}
		});

		return {
			success: true,
			result: {
				guessLat,
				guessLng,
				actualLat: picture.latitude,
				actualLng: picture.longitude,
				distance: Math.round(distance),
				points,
				timedOut: false
			}
		};
	}

	/**
	 * Get user's daily status
	 */
	async getStatus(username: string) {
		const userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		const hasPlayed = await this.hasPlayedToday(username);

		return {
			hasPlayed,
			currentStreak: userDaily?.currentStreak || 0,
			maxStreak: userDaily?.maxStreak || 0,
			todayPoints: hasPlayed ? userDaily?.points : null,
			todayDistance: hasPlayed ? userDaily?.distance : null
		};
	}

	/**
	 * Get today's result for a user who has already played
	 */
	async getTodayResult(username: string) {
		const hasPlayed = await this.hasPlayedToday(username);
		if (!hasPlayed) {
			return null;
		}

		const userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		if (!userDaily) {
			return null;
		}

		// Get today's challenge for actual location
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const dailyChallenge = await prisma.dailyChallenge.findUnique({
			where: { date: today },
			include: { picture: true }
		});

		if (!dailyChallenge) {
			return null;
		}

		// Check if this was a timeout (null coords)
		const timedOut = userDaily.guessLat === null || userDaily.guessLng === null;

		return {
			guessLat: userDaily.guessLat,
			guessLng: userDaily.guessLng,
			actualLat: dailyChallenge.picture.latitude,
			actualLng: dailyChallenge.picture.longitude,
			distance: timedOut ? 0 : userDaily.distance,
			points: timedOut ? 0 : userDaily.points,
			currentStreak: userDaily.currentStreak,
			timedOut
		};
	}
}
