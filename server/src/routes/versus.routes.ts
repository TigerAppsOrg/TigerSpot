import { Router } from 'express';
import { VersusController } from '../controllers/versus.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const versusController = new VersusController();

// All versus routes require authentication
router.use(authMiddleware);

// Heartbeat to update presence
router.post('/heartbeat', versusController.heartbeat);

// List available opponents (also updates presence)
router.get('/players', versusController.getPlayers);

// Get user's challenges (sent, received, active, completed)
router.get('/challenges', versusController.getChallenges);

// Create a new challenge
router.post('/challenge', versusController.createChallenge);

// Accept a challenge
router.post('/:id/accept', versusController.acceptChallenge);

// Decline a challenge
router.post('/:id/decline', versusController.declineChallenge);

// Cancel a sent challenge
router.delete('/:id', versusController.cancelChallenge);

// Get challenge details
router.get('/:id', versusController.getChallenge);

// Get round pictures for a match
router.get('/:id/rounds', versusController.getRounds);

// Submit guess for a round (also handled via WebSocket)
router.post('/:id/submit', versusController.submitRound);

// Get final results
router.get('/:id/results', versusController.getResults);

export default router;
