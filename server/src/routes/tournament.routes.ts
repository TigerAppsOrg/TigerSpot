import { Router } from 'express';
import { TournamentController } from '../controllers/tournament.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const tournamentController = new TournamentController();

// All tournament routes require authentication
router.use(authMiddleware);

// List all tournaments
router.get('/', tournamentController.list);

// Get tournament details and bracket
router.get('/:id', tournamentController.get);

// Join a tournament
router.post('/:id/join', tournamentController.join);

// Leave a tournament (before it starts)
router.post('/:id/leave', tournamentController.leave);

// Get live bracket state
router.get('/:id/bracket', tournamentController.getBracket);

// Get match details
router.get('/:id/match/:matchId', tournamentController.getMatch);

// Get round pictures for a match
router.get('/:id/match/:matchId/rounds', tournamentController.getMatchRounds);

// Start a round (track timing to prevent refresh exploits)
router.post('/:id/match/:matchId/start-round', tournamentController.startRound);

// Submit guess for a tournament match round
router.post('/:id/match/:matchId/submit', tournamentController.submitRound);

// Get match results (scores for both players)
router.get('/:id/match/:matchId/results', tournamentController.getMatchResults);

// Get match status (for polling while waiting for opponent)
router.get('/:id/match/:matchId/status', tournamentController.getMatchStatus);

export default router;
