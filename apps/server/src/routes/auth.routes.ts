import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { config } from '../config/index.js';

const router = Router();
const authController = new AuthController();

// Redirect to Princeton CAS login
router.get('/login', authController.login);

// CAS callback - validate ticket and create session
router.get('/callback', authController.callback);

// Logout (GET because frontend uses window.location.href redirect)
router.get('/logout', authController.logout);

// Get current user
router.get('/me', authController.me);

// Dev-only endpoints for testing with different users
if (config.nodeEnv === 'development') {
	router.get('/dev/users', authController.devListUsers);
	router.post('/dev/login/:username', authController.devLogin);
}

export default router;
