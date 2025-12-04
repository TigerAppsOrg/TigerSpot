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

		// If no challenge set for today, pick a random picture
		if (!dailyChallenge) {
			const pictures = await prisma.picture.findMany();
			if (pictures.length === 0) {
				return null;
			}

			const randomPicture = pictures[Math.floor(Math.random() * pictures.length)];

			dailyChallenge = await prisma.dailyChallenge.create({
				data: {
					date: today,
					pictureId: randomPicture.id
				},
				include: { picture: true }
			});
		}

		return {
			id: dailyChallenge.picture.id,
			imageUrl: dailyChallenge.picture.imageUrl
			// Don't expose actual coordinates until after submission
		};
	}

	/**
	 * Check if user has played today's challenge
	 */
	async hasPlayedToday(username: string): Promise<boolean> {
		const userDaily = await prisma.userDaily.findUnique({
			where: { username }
		});

		if (!userDaily || !userDaily.lastPlayed) {
			return false;
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const lastPlayed = new Date(userDaily.lastPlayed);
		lastPlayed.setHours(0, 0, 0, 0);

		return lastPlayed.getTime() === today.getTime();
	}

	/**
	 * Submit a guess for today's challenge
	 */
	async submitGuess(
		username: string,
		guessLat: number,
		guessLng: number
	): Promise<{
		success: boolean;
		error?: string;
		result?: {
			guessLat: number;
			guessLng: number;
			actualLat: number;
			actualLng: number;
			distance: number;
			points: number;
			placeName: string;
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

		// Calculate distance and points
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
				maxStreak: userDaily ? Math.max(userDaily.maxStreak, newStreak) : newStreak
			},
			create: {
				username,
				points,
				distance: Math.round(distance),
				played: true,
				lastPlayed: new Date(),
				currentStreak: 1,
				maxStreak: 1
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
				placeName: picture.placeName
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
}
