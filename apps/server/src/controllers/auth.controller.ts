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
			res.redirect(`${config.cors.frontendUrl}/?error=no_ticket`);
			return;
		}

		try {
			// Validate ticket with CAS
			const userData = await this.authService.validateCASTicket(ticket);

			if (!userData) {
				res.redirect(`${config.cors.frontendUrl}/?error=invalid_ticket`);
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
			res.redirect(`${config.cors.frontendUrl}/?error=auth_error`);
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

	/**
	 * [DEV ONLY] List all users for dev testing
	 */
	devListUsers = async (_req: Request, res: Response) => {
		try {
			const { prisma } = await import('../config/database.js');
			const users = await prisma.user.findMany({
				select: {
					username: true,
					displayName: true,
					isAdmin: true,
					totalPoints: true
				},
				orderBy: { username: 'asc' }
			});

			// Also include some preset test users that can be created
			const testUsers = [
				{ username: 'testuser1', displayName: 'Test User 1', classYear: '2026' },
				{ username: 'testuser2', displayName: 'Test User 2', classYear: '2027' },
				{ username: 'testuser3', displayName: 'Test User 3', classYear: '2025' },
				{ username: 'testadmin', displayName: 'Test Admin', classYear: 'Graduate', isAdmin: true }
			];

			res.json({
				existingUsers: users,
				availableTestUsers: testUsers
			});
		} catch (error) {
			console.error('Error listing users:', error);
			res.status(500).json({ error: 'Failed to list users' });
		}
	};

	/**
	 * [DEV ONLY] Login as any user (creates if doesn't exist)
	 */
	devLogin = async (req: Request, res: Response) => {
		const { username } = req.params;

		if (!username) {
			res.status(400).json({ error: 'Username required' });
			return;
		}

		try {
			const { prisma } = await import('../config/database.js');

			// Define test user presets
			const testUserPresets: Record<
				string,
				{ displayName: string; classYear: string; isAdmin: boolean }
			> = {
				testuser1: { displayName: 'Test User 1', classYear: '2026', isAdmin: false },
				testuser2: { displayName: 'Test User 2', classYear: '2027', isAdmin: false },
				testuser3: { displayName: 'Test User 3', classYear: '2025', isAdmin: false },
				testadmin: { displayName: 'Test Admin', classYear: 'Graduate', isAdmin: true }
			};

			// Find or create user
			let user = await prisma.user.findUnique({
				where: { username }
			});

			if (!user) {
				// Use preset if available, otherwise create generic test user
				const preset = testUserPresets[username] || {
					displayName: username,
					classYear: '2026',
					isAdmin: false
				};

				user = await prisma.user.create({
					data: {
						username,
						displayName: preset.displayName,
						classYear: preset.classYear,
						isAdmin: preset.isAdmin,
						daily: { create: {} }
					}
				});
			}

			// Generate JWT token
			const token = this.authService.generateToken(user.username, user.isAdmin);

			// Set httpOnly cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: false, // Dev mode
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
			});

			res.json({
				success: true,
				user: {
					username: user.username,
					displayName: user.displayName,
					isAdmin: user.isAdmin
				}
			});
		} catch (error) {
			console.error('Dev login error:', error);
			res.status(500).json({ error: 'Failed to login' });
		}
	};
}
