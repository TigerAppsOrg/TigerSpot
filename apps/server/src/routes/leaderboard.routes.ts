import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const leaderboardController = new LeaderboardController();

// Leaderboard is public but some stats require auth
router.get('/daily', leaderboardController.getDaily);
router.get('/total', leaderboardController.getTotal);
router.get('/streaks', leaderboardController.getStreaks);

// User stats (requires auth)
router.get('/me', authMiddleware, leaderboardController.getMyStats);

export default router;
