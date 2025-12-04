import type { Request, Response } from 'express';
import { config } from '../config/index.js';
import { AuthService } from '../services/auth.service.js';
import type { AuthRequest } from '../types/index.js';

export class AuthController {
	private authService = new AuthService();

	/**
	 * Redirect to Princeton CAS login
	 */
	login = (_req: Request, res: Response) => {
		const loginUrl = this.authService.getLoginUrl();
		res.redirect(loginUrl);
	};

	/**
	 * CAS callback - validate ticket and create session
	 */
	callback = async (req: Request, res: Response) => {
		const { ticket } = req.query;

		if (!ticket || typeof ticket !== 'string') {
			res.redirect(`${config.cors.frontendUrl}/login?error=no_ticket`);
			return;
		}

		try {
			// Validate ticket with CAS
			const userData = await this.authService.validateCASTicket(ticket);

			if (!userData) {
				res.redirect(`${config.cors.frontendUrl}/login?error=invalid_ticket`);
				return;
			}

			// Find or create user in database
			const user = await this.authService.findOrCreateUser(userData);

			// Generate JWT token
			const token = this.authService.generateToken(user.username, user.isAdmin);

			// Set httpOnly cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: config.nodeEnv === 'production',
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
			});

			// Redirect to frontend
			res.redirect(`${config.cors.frontendUrl}/menu`);
		} catch (error) {
			console.error('CAS callback error:', error);
			res.redirect(`${config.cors.frontendUrl}/login?error=auth_error`);
		}
	};

	/**
	 * Logout - clear cookie and redirect to CAS logout
	 */
	logout = (_req: Request, res: Response) => {
		res.clearCookie('token');
		const logoutUrl = this.authService.getLogoutUrl(config.cors.frontendUrl);
		res.redirect(logoutUrl);
	};

	/**
	 * Get current user info
	 */
	me = async (req: AuthRequest, res: Response) => {
		// Try to get token from cookie
		const token = req.cookies?.token;

		if (!token) {
			res.status(401).json({ error: 'Not authenticated' });
			return;
		}

		const payload = this.authService.verifyToken(token);
		if (!payload) {
			res.status(401).json({ error: 'Invalid token' });
			return;
		}

		try {
			const { prisma } = await import('../config/database.js');
			const user = await prisma.user.findUnique({
				where: { username: payload.username },
				include: { daily: true }
			});

			if (!user) {
				res.status(404).json({ error: 'User not found' });
				return;
			}

			res.json({
				username: user.username,
				displayName: user.displayName,
				email: user.email,
				classYear: user.classYear,
				totalPoints: user.totalPoints,
				currentStreak: user.daily?.currentStreak || 0,
				isAdmin: user.isAdmin
			});
		} catch (error) {
			console.error('Error fetching user:', error);
			res.status(500).json({ error: 'Failed to fetch user' });
		}
	};
}
