import { Router, type Router as RouterType } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SoloController } from '../controllers/solo.controller.js';

const router: RouterType = Router();
const soloController = new SoloController();

router.use(authMiddleware);

router.get('/rounds', soloController.getRounds);
router.post('/submit', soloController.submitGuess);

export default router;
