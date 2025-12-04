import type { Response } from 'express';
import { TournamentService } from '../services/tournament.service.js';
import { BracketService } from '../services/bracket.service.js';
import type { AuthRequest } from '../types/index.js';

export class TournamentController {
	private tournamentService = new TournamentService();
	private bracketService = new BracketService();

	/**
	 * List all tournaments
	 */
	list = async (_req: AuthRequest, res: Response) => {
		try {
			const tournaments = await this.tournamentService.listTournaments();
			res.json(tournaments);
		} catch (error) {
			console.error('Error listing tournaments:', error);
			res.status(500).json({ error: 'Failed to list tournaments' });
		}
	};

	/**
	 * Get tournament details
	 */
	get = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const tournament = await this.tournamentService.getTournament(id);
			if (!tournament) {
				res.status(404).json({ error: 'Tournament not found' });
				return;
			}
			res.json(tournament);
		} catch (error) {
			console.error('Error getting tournament:', error);
			res.status(500).json({ error: 'Failed to get tournament' });
		}
	};

	/**
	 * Join a tournament
	 */
	join = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			await this.tournamentService.joinTournament(id, req.user!.username);
			res.json({ success: true });
		} catch (error) {
			console.error('Error joining tournament:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Leave a tournament
	 */
	leave = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			await this.tournamentService.leaveTournament(id, req.user!.username);
			res.json({ success: true });
		} catch (error) {
			console.error('Error leaving tournament:', error);
			res.status(400).json({ error: (error as Error).message });
		}
	};

	/**
	 * Get bracket state
	 */
	getBracket = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const bracket = await this.bracketService.getBracket(id);
			res.json(bracket);
		} catch (error) {
			console.error('Error getting bracket:', error);
			res.status(500).json({ error: 'Failed to get bracket' });
		}
	};

	/**
	 * Get match details
	 */
	getMatch = async (req: AuthRequest, res: Response) => {
		const matchId = parseInt(req.params.matchId, 10);
		if (isNaN(matchId)) {
			res.status(400).json({ error: 'Invalid match ID' });
			return;
		}

		try {
			const match = await this.tournamentService.getMatch(matchId);
			if (!match) {
				res.status(404).json({ error: 'Match not found' });
				return;
			}
			res.json(match);
		} catch (error) {
			console.error('Error getting match:', error);
			res.status(500).json({ error: 'Failed to get match' });
		}
	};

	/**
	 * Get round pictures for a match
	 */
	getMatchRounds = async (req: AuthRequest, res: Response) => {
		const matchId = parseInt(req.params.matchId, 10);
		if (isNaN(matchId)) {
			res.status(400).json({ error: 'Invalid match ID' });
			return;
		}

		try {
			const rounds = await this.tournamentService.getMatchRounds(matchId);
			res.json(rounds);
		} catch (error) {
			console.error('Error getting match rounds:', error);
			res.status(500).json({ error: 'Failed to get match rounds' });
		}
	};

	/**
	 * Submit a round guess
	 */
	submitRound = async (req: AuthRequest, res: Response) => {
		const matchId = parseInt(req.params.matchId, 10);
		if (isNaN(matchId)) {
			res.status(400).json({ error: 'Invalid match ID' });
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
			const result = await this.tournamentService.submitRound(
				matchId,
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
}
