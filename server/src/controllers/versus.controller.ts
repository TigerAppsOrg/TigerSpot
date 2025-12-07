import type { Response } from 'express';
import { VersusService } from '../services/versus.service.js';
import type { AuthRequest } from '../types/index.js';

export class VersusController {
	private versusService = new VersusService();

	/**
	 * Heartbeat to update user presence on versus page
	 */
	heartbeat = async (req: AuthRequest, res: Response) => {
		try {
			await this.versusService.updatePresence(req.user!.username);
			res.json({ success: true });
		} catch (error) {
			console.error('Error updating presence:', error);
			res.status(500).json({ error: 'Failed to update presence' });
		}
	};

	/**
	 * Get available players to challenge (only online users)
	 */
	getPlayers = async (req: AuthRequest, res: Response) => {
		try {
			// Update presence when fetching players
			await this.versusService.updatePresence(req.user!.username);
			const players = await this.versusService.getAvailablePlayers(req.user!.username);
			res.json(players);
		} catch (error) {
			console.error('Error getting players:', error);
			res.status(500).json({ error: 'Failed to get players' });
		}
	};

	/**
	 * Get user's challenges
	 */
	getChallenges = async (req: AuthRequest, res: Response) => {
		try {
			const challenges = await this.versusService.getChallenges(req.user!.username);
			res.json(challenges);
		} catch (error) {
			console.error('Error getting challenges:', error);
			res.status(500).json({ error: 'Failed to get challenges' });
		}
	};

	/**
	 * Create a new challenge
	 */
	createChallenge = async (req: AuthRequest, res: Response) => {
		const { opponentUsername } = req.body;

		if (!opponentUsername) {
			res.status(400).json({ error: 'Opponent username is required' });
			return;
		}

		try {
			const challenge = await this.versusService.createChallenge(
				req.user!.username,
				opponentUsername
			);
			res.json(challenge);
		} catch (error) {
			console.error('Error creating challenge:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Accept a challenge
	 */
	acceptChallenge = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const challenge = await this.versusService.acceptChallenge(challengeId, req.user!.username);
			res.json(challenge);
		} catch (error) {
			console.error('Error accepting challenge:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Decline a challenge
	 */
	declineChallenge = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const challenge = await this.versusService.declineChallenge(challengeId, req.user!.username);
			res.json(challenge);
		} catch (error) {
			console.error('Error declining challenge:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Cancel a sent challenge
	 */
	cancelChallenge = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const result = await this.versusService.cancelChallenge(challengeId, req.user!.username);
			res.json(result);
		} catch (error) {
			console.error('Error canceling challenge:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Get challenge details
	 */
	getChallenge = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const { prisma } = await import('../config/database.js');
			const challenge = await prisma.challenge.findUnique({
				where: { id: challengeId },
				include: {
					challenger: { select: { displayName: true } },
					challengee: { select: { displayName: true } }
				}
			});

			if (!challenge) {
				res.status(404).json({ error: 'Challenge not found' });
				return;
			}

			res.json(challenge);
		} catch (error) {
			console.error('Error getting challenge:', error);
			res.status(500).json({ error: 'Failed to get challenge' });
		}
	};

	/**
	 * Get round pictures for a challenge
	 */
	getRounds = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const rounds = await this.versusService.getRounds(challengeId);
			res.json(rounds);
		} catch (error) {
			console.error('Error getting rounds:', error);
			res.status(500).json({ error: 'Failed to get rounds' });
		}
	};

	/**
	 * Submit a round guess
	 */
	submitRound = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		const { roundNumber, latitude, longitude, timeSeconds } = req.body;

		if (
			typeof roundNumber !== 'number' ||
			typeof latitude !== 'number' ||
			typeof longitude !== 'number' ||
			typeof timeSeconds !== 'number'
		) {
			res.status(400).json({ error: 'Invalid submission data' });
			return;
		}

		try {
			const result = await this.versusService.submitRound(
				challengeId,
				req.user!.username,
				roundNumber,
				latitude,
				longitude,
				timeSeconds
			);
			res.json(result);
		} catch (error) {
			console.error('Error submitting round:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Get challenge results
	 */
	getResults = async (req: AuthRequest, res: Response) => {
		const challengeId = parseInt(req.params.id, 10);
		if (isNaN(challengeId)) {
			res.status(400).json({ error: 'Invalid challenge ID' });
			return;
		}

		try {
			const results = await this.versusService.getResults(challengeId);
			res.json(results);
		} catch (error) {
			console.error('Error getting results:', error);
			res.status(500).json({ error: 'Failed to get results' });
		}
	};
}
