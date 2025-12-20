import type { Request, Response } from 'express';
import { SoloService } from '../services/solo.service.js';

export class SoloController {
	private soloService = new SoloService();

	getRounds = async (req: Request, res: Response) => {
		try {
			const countParam = req.query.count;
			const count = typeof countParam === 'string' ? Number.parseInt(countParam, 10) : 5;
			const safeCount = Number.isFinite(count) && count > 0 ? Math.min(count, 20) : 5;
			const rounds = await this.soloService.getRounds(safeCount);
			res.json(rounds);
		} catch (error) {
			console.error('Error getting solo rounds:', error);
			res.status(500).json({ error: 'Failed to get rounds' });
		}
	};

	submitGuess = async (req: Request, res: Response) => {
		try {
			const { pictureId, guessLat, guessLng } = req.body as {
				pictureId?: number;
				guessLat?: number;
				guessLng?: number;
			};

			if (!Number.isFinite(pictureId) || !Number.isFinite(guessLat) || !Number.isFinite(guessLng)) {
				res.status(400).json({ error: 'Invalid guess payload' });
				return;
			}

			const result = await this.soloService.submitGuess(pictureId!, guessLat!, guessLng!);
			if (!result) {
				res.status(404).json({ error: 'Picture not found' });
				return;
			}

			res.json(result);
		} catch (error) {
			console.error('Error submitting solo guess:', error);
			res.status(500).json({ error: 'Failed to submit guess' });
		}
	};
}
