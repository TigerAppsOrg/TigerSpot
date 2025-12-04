import { Router } from 'express';
import { GameController } from '../controllers/game.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const gameController = new GameController();

// All game routes require authentication
router.use(authMiddleware);

// Get today's challenge
router.get('/today', gameController.getToday);

// Submit guess for daily challenge
router.post('/submit', gameController.submit);

// Check if user has played today
router.get('/status', gameController.getStatus);

export default router;
