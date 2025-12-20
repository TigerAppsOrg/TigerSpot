import { prisma } from '../config/database.js';
import { calculateDailyPoints, calculateDistance } from '../utils/distance.js';
import type { Prisma } from '@prisma/client';

export class SoloService {
	async getRounds(count: number) {
		const pictures = await prisma.picture.findMany({
			where: { showInDaily: true },
			select: {
				id: true,
				imageUrl: true
			}
		});

		if (pictures.length === 0) {
			return [];
		}

		const shuffled = [...pictures].sort(() => Math.random() - 0.5);
		const rounds: Prisma.PictureGetPayload<{
			select: { id: true; imageUrl: true };
		}>[] = [];

		for (let i = 0; i < count; i++) {
			rounds.push(shuffled[i % shuffled.length]);
		}

		return rounds.map((picture) => ({
			id: picture.id,
			imageUrl: picture.imageUrl
		}));
	}

	async submitGuess(pictureId: number, guessLat: number, guessLng: number) {
		const picture = await prisma.picture.findUnique({
			where: { id: pictureId },
			select: { latitude: true, longitude: true }
		});

		if (!picture) {
			return null;
		}

		const distance = calculateDistance(guessLat, guessLng, picture.latitude, picture.longitude);
		const points = calculateDailyPoints(distance);

		return {
			distance,
			points,
			actualLat: picture.latitude,
			actualLng: picture.longitude
		};
	}
}
