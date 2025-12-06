import type { Response } from 'express';
import { prisma } from '../config/database.js';
import { ImageService } from '../services/image.service.js';
import { BracketService } from '../services/bracket.service.js';
import type { AuthRequest } from '../types/index.js';
import type { Difficulty } from '@prisma/client';

export class AdminController {
	private imageService = new ImageService();
	private bracketService = new BracketService();

	/**
	 * List all images
	 */
	listImages = async (_req: AuthRequest, res: Response) => {
		try {
			const pictures = await this.imageService.listPictures();
			res.json(pictures);
		} catch (error) {
			console.error('Error listing images:', error);
			res.status(500).json({ error: 'Failed to list images' });
		}
	};

	/**
	 * Process image to generate preview and extract GPS
	 * Used for client-side preview of HEIC and other formats
	 */
	processImagePreview = async (req: AuthRequest, res: Response) => {
		if (!req.file) {
			res.status(400).json({ error: 'No image file provided' });
			return;
		}

		try {
			const result = await this.imageService.processImagePreview(req.file.buffer);
			res.json(result);
		} catch (error) {
			console.error('Error processing image preview:', error);
			res.status(500).json({ error: 'Failed to process image' });
		}
	};

	/**
	 * Upload image with EXIF extraction
	 */
	uploadImage = async (req: AuthRequest, res: Response) => {
		if (!req.file) {
			res.status(400).json({ error: 'No image file provided' });
			return;
		}

		try {
			// Extract EXIF GPS data
			const exifData = await this.imageService.extractExifData(req.file.buffer);

			// Check for manual coordinates from request body
			const manualLat = req.body.latitude ? parseFloat(req.body.latitude) : null;
			const manualLng = req.body.longitude ? parseFloat(req.body.longitude) : null;

			// Use EXIF coordinates if available, otherwise fall back to manual
			const latitude = exifData.latitude ?? manualLat;
			const longitude = exifData.longitude ?? manualLng;

			// If we have coordinates (from either source), proceed with upload
			if (latitude !== null && longitude !== null) {
				// Upload to Cloudinary
				const uploadResult = await this.imageService.uploadToCloudinary(
					req.file.buffer,
					req.file.originalname
				);

				// Get difficulty from request body
				const difficulty = (req.body.difficulty as Difficulty) || 'MEDIUM';

				// Get visibility flags from request body (default to true if not specified)
				const showInDaily = req.body.showInDaily !== 'false';
				const showInVersus = req.body.showInVersus !== 'false';
				const showInTournament = req.body.showInTournament !== 'false';

				// Create database record
				const picture = await this.imageService.createPicture({
					cloudinaryId: uploadResult.publicId,
					imageUrl: uploadResult.url,
					latitude,
					longitude,
					difficulty,
					uploadedBy: req.user!.username,
					showInDaily,
					showInVersus,
					showInTournament
				});

				res.json({
					success: true,
					picture,
					exifExtracted: exifData.latitude !== null
				});
			} else {
				// No GPS data from EXIF and no manual coordinates provided
				res.json({
					success: false,
					exifExtracted: false,
					message: 'No GPS data found in image. Please provide coordinates manually.',
					requiresCoordinates: true
				});
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			res.status(500).json({ error: 'Failed to upload image' });
		}
	};

	/**
	 * Update image metadata
	 */
	updateImage = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid image ID' });
			return;
		}

		const { latitude, longitude, difficulty, showInDaily, showInVersus, showInTournament } =
			req.body;

		try {
			const picture = await this.imageService.updatePicture(id, {
				latitude,
				longitude,
				difficulty,
				showInDaily,
				showInVersus,
				showInTournament
			});

			res.json(picture);
		} catch (error) {
			console.error('Error updating image:', error);
			res.status(500).json({ error: 'Failed to update image' });
		}
	};

	/**
	 * Delete image
	 */
	deleteImage = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid image ID' });
			return;
		}

		try {
			await this.imageService.deletePicture(id);
			res.json({ success: true });
		} catch (error) {
			console.error('Error deleting image:', error);
			res.status(500).json({ error: 'Failed to delete image' });
		}
	};

	/**
	 * List all users
	 */
	listUsers = async (_req: AuthRequest, res: Response) => {
		try {
			const users = await prisma.user.findMany({
				orderBy: { createdAt: 'desc' },
				select: {
					username: true,
					displayName: true,
					email: true,
					classYear: true,
					totalPoints: true,
					isAdmin: true,
					createdAt: true
				}
			});

			res.json(users);
		} catch (error) {
			console.error('Error listing users:', error);
			res.status(500).json({ error: 'Failed to list users' });
		}
	};

	/**
	 * Update user (e.g., grant/revoke admin)
	 */
	updateUser = async (req: AuthRequest, res: Response) => {
		const { username } = req.params;
		const { isAdmin } = req.body;

		try {
			const user = await prisma.user.update({
				where: { username },
				data: { isAdmin }
			});

			res.json({
				username: user.username,
				displayName: user.displayName,
				isAdmin: user.isAdmin
			});
		} catch (error) {
			console.error('Error updating user:', error);
			res.status(500).json({ error: 'Failed to update user' });
		}
	};

	/**
	 * Create a new tournament
	 * Note: Tournaments use mixed difficulty that escalates through stages
	 */
	createTournament = async (req: AuthRequest, res: Response) => {
		const {
			name,
			timeLimit = 120,
			roundsPerMatch = 5,
			maxParticipants // null = unlimited (no default)
		} = req.body;

		if (!name) {
			res.status(400).json({ error: 'Tournament name is required' });
			return;
		}

		try {
			const tournament = await prisma.tournament.create({
				data: {
					name,
					timeLimit,
					roundsPerMatch,
					maxParticipants: maxParticipants ?? null,
					createdBy: req.user!.username
				}
			});

			res.json(tournament);
		} catch (error) {
			console.error('Error creating tournament:', error);
			res.status(500).json({ error: 'Failed to create tournament' });
		}
	};

	/**
	 * Start a tournament
	 */
	startTournament = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const tournament = await prisma.tournament.findUnique({
				where: { id },
				include: { participants: true }
			});

			if (!tournament) {
				res.status(404).json({ error: 'Tournament not found' });
				return;
			}

			if (tournament.status !== 'OPEN') {
				res.status(400).json({ error: 'Tournament cannot be started' });
				return;
			}

			if (tournament.participants.length < 2) {
				res.status(400).json({ error: 'Not enough participants' });
				return;
			}

			// Generate bracket
			const participantUsernames = tournament.participants.map((p) => p.username);
			await this.bracketService.generateBracket(id, participantUsernames);

			// Update tournament status
			const updatedTournament = await prisma.tournament.update({
				where: { id },
				data: {
					status: 'IN_PROGRESS',
					startedAt: new Date()
				}
			});

			res.json(updatedTournament);
		} catch (error) {
			console.error('Error starting tournament:', error);
			res.status(500).json({ error: 'Failed to start tournament' });
		}
	};

	/**
	 * Cancel a tournament
	 */
	cancelTournament = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const tournament = await prisma.tournament.update({
				where: { id },
				data: { status: 'CANCELLED' }
			});

			res.json(tournament);
		} catch (error) {
			console.error('Error cancelling tournament:', error);
			res.status(500).json({ error: 'Failed to cancel tournament' });
		}
	};

	/**
	 * Delete a tournament permanently
	 */
	deleteTournament = async (req: AuthRequest, res: Response) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const tournament = await prisma.tournament.findUnique({
				where: { id }
			});

			if (!tournament) {
				res.status(404).json({ error: 'Tournament not found' });
				return;
			}

			// Delete related records first (matches, participants)
			await prisma.tournamentMatch.deleteMany({
				where: { tournamentId: id }
			});

			await prisma.tournamentParticipant.deleteMany({
				where: { tournamentId: id }
			});

			// Delete the tournament
			await prisma.tournament.delete({
				where: { id }
			});

			res.json({ success: true });
		} catch (error) {
			console.error('Error deleting tournament:', error);
			res.status(500).json({ error: 'Failed to delete tournament' });
		}
	};

	// ==================== DEV-ONLY TEST ENDPOINTS ====================

	/**
	 * Add test players to a tournament (DEV ONLY)
	 */
	addTestPlayers = async (req: AuthRequest, res: Response) => {
		if (process.env.NODE_ENV === 'production') {
			res.status(403).json({ error: 'Not available in production' });
			return;
		}

		const id = parseInt(req.params.id, 10);
		const { count = 7 } = req.body;

		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid tournament ID' });
			return;
		}

		try {
			const tournament = await prisma.tournament.findUnique({
				where: { id },
				include: { participants: true }
			});

			if (!tournament) {
				res.status(404).json({ error: 'Tournament not found' });
				return;
			}

			if (tournament.status !== 'OPEN') {
				res.status(400).json({ error: 'Tournament must be OPEN to add test players' });
				return;
			}

			const addedPlayers: string[] = [];

			for (let i = 1; i <= count; i++) {
				const username = `test_player_${i}`;

				// Check if test user exists, if not create them
				await prisma.user.upsert({
					where: { username },
					update: {},
					create: {
						username,
						displayName: `Test Player ${i}`,
						email: null,
						classYear: null,
						isAdmin: false
					}
				});

				// Check if already in tournament
				const existing = tournament.participants.find((p) => p.username === username);
				if (!existing) {
					await prisma.tournamentParticipant.create({
						data: {
							tournamentId: id,
							username
						}
					});
					addedPlayers.push(username);
				}
			}

			res.json({
				success: true,
				addedPlayers,
				message: `Added ${addedPlayers.length} test players`
			});
		} catch (error) {
			console.error('Error adding test players:', error);
			res.status(500).json({ error: 'Failed to add test players' });
		}
	};

	/**
	 * Simulate a match result (DEV ONLY)
	 */
	simulateMatchWinner = async (req: AuthRequest, res: Response) => {
		if (process.env.NODE_ENV === 'production') {
			res.status(403).json({ error: 'Not available in production' });
			return;
		}

		const tournamentId = parseInt(req.params.id, 10);
		const matchId = parseInt(req.params.matchId, 10);
		const { winnerId } = req.body;

		if (isNaN(tournamentId) || isNaN(matchId)) {
			res.status(400).json({ error: 'Invalid tournament or match ID' });
			return;
		}

		if (!winnerId) {
			res.status(400).json({ error: 'winnerId is required' });
			return;
		}

		try {
			const match = await prisma.tournamentMatch.findUnique({
				where: { id: matchId }
			});

			if (!match) {
				res.status(404).json({ error: 'Match not found' });
				return;
			}

			if (match.tournamentId !== tournamentId) {
				res.status(400).json({ error: 'Match does not belong to this tournament' });
				return;
			}

			if (match.status === 'COMPLETED') {
				res.status(400).json({ error: 'Match already completed' });
				return;
			}

			if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
				res.status(400).json({ error: 'winnerId must be one of the match players' });
				return;
			}

			// Set scores (winner gets higher score)
			const player1Score = winnerId === match.player1Id ? 5000 : 3000;
			const player2Score = winnerId === match.player2Id ? 5000 : 3000;

			await prisma.tournamentMatch.update({
				where: { id: matchId },
				data: {
					player1Score,
					player2Score,
					status: 'COMPLETED',
					completedAt: new Date()
				}
			});

			// Advance winner in bracket
			await this.bracketService.advanceWinner(matchId, winnerId);

			res.json({
				success: true,
				matchId,
				winnerId,
				player1Score,
				player2Score
			});
		} catch (error) {
			console.error('Error simulating match:', error);
			res.status(500).json({ error: 'Failed to simulate match' });
		}
	};

	/**
	 * Set tomorrow's daily challenge
	 */
	setDailyChallenge = async (req: AuthRequest, res: Response) => {
		const { pictureId, date } = req.body;

		if (!pictureId) {
			res.status(400).json({ error: 'Picture ID is required' });
			return;
		}

		try {
			const targetDate = date ? new Date(date) : new Date();
			targetDate.setDate(targetDate.getDate() + 1); // Default to tomorrow
			targetDate.setHours(0, 0, 0, 0);

			const dailyChallenge = await prisma.dailyChallenge.upsert({
				where: { date: targetDate },
				update: { pictureId },
				create: {
					date: targetDate,
					pictureId
				},
				include: { picture: true }
			});

			res.json(dailyChallenge);
		} catch (error) {
			console.error('Error setting daily challenge:', error);
			res.status(500).json({ error: 'Failed to set daily challenge' });
		}
	};
}
