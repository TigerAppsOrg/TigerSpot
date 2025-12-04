import type { Response } from 'express';
import { DailyService } from '../services/daily.service.js';
import type { AuthRequest } from '../types/index.js';

export class GameController {
	private dailyService = new DailyService();

	/**
	 * Get today's challenge picture
	 */
	getToday = async (req: AuthRequest, res: Response) => {
		try {
			const challenge = await this.dailyService.getTodayChallenge();

			if (!challenge) {
				res.status(404).json({ error: 'No challenge available' });
				return;
			}

			// Check if user has already played
			const hasPlayed = await this.dailyService.hasPlayedToday(req.user!.username);

			res.json({
				...challenge,
				hasPlayed
			});
		} catch (error) {
			console.error('Error getting today challenge:', error);
			res.status(500).json({ error: 'Failed to get challenge' });
		}
	};

	/**
	 * Submit guess for daily challenge
	 */
	submit = async (req: AuthRequest, res: Response) => {
		const { latitude, longitude } = req.body;

		if (typeof latitude !== 'number' || typeof longitude !== 'number') {
			res.status(400).json({ error: 'Invalid coordinates' });
			return;
		}

		try {
			const result = await this.dailyService.submitGuess(req.user!.username, latitude, longitude);

			if (!result.success) {
				res.status(400).json({ error: result.error });
				return;
			}

			res.json(result.result);
		} catch (error) {
			console.error('Error submitting guess:', error);
			res.status(500).json({ error: 'Failed to submit guess' });
		}
	};

	/**
	 * Get user's daily status
	 */
	getStatus = async (req: AuthRequest, res: Response) => {
		try {
			const status = await this.dailyService.getStatus(req.user!.username);
			res.json(status);
		} catch (error) {
			console.error('Error getting status:', error);
			res.status(500).json({ error: 'Failed to get status' });
		}
	};
}
