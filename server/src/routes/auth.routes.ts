import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();
const authController = new AuthController();

// Redirect to Princeton CAS login
router.get('/login', authController.login);

// CAS callback - validate ticket and create session
router.get('/callback', authController.callback);

// Logout
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authController.me);

export default router;
