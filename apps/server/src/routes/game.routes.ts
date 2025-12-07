import { Router, type Router as RouterType } from 'express';
import { GameController } from '../controllers/game.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router: RouterType = Router();
const gameController = new GameController();

// All game routes require authentication
router.use(authMiddleware);

// Get today's challenge
router.get('/today', gameController.getToday);

// Start challenge (anti-cheat: records server-side start time)
router.post('/start', gameController.startChallenge);

// Submit guess for daily challenge
router.post('/submit', gameController.submit);

// Check if user has played today
router.get('/status', gameController.getStatus);

// Get today's result (for users who have already played)
router.get('/result', gameController.getTodayResult);

export default router;
