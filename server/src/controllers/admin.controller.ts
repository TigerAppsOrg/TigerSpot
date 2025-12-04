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

      // If we have GPS coordinates, we can proceed with full upload
      // Otherwise, return the EXIF data so frontend can request manual input
      if (exifData.latitude !== null && exifData.longitude !== null) {
        // Upload to Cloudinary
        const uploadResult = await this.imageService.uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );

        // Get additional fields from request body
        const placeName = req.body.placeName || 'Unknown Location';
        const difficulty = (req.body.difficulty as Difficulty) || 'MEDIUM';

        // Create database record
        const picture = await this.imageService.createPicture({
          cloudinaryId: uploadResult.publicId,
          imageUrl: uploadResult.url,
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          placeName,
          difficulty,
          uploadedBy: req.user!.username
        });

        res.json({
          success: true,
          picture,
          exifExtracted: true
        });
      } else {
        // No GPS data - upload to Cloudinary but require manual coordinates
        const uploadResult = await this.imageService.uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );

        res.json({
          success: true,
          uploadResult,
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

    const { latitude, longitude, placeName, difficulty } = req.body;

    try {
      const picture = await this.imageService.updatePicture(id, {
        latitude,
        longitude,
        placeName,
        difficulty
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
   */
  createTournament = async (req: AuthRequest, res: Response) => {
    const {
      name,
      difficulty = 'MEDIUM',
      timeLimit = 120,
      roundsPerMatch = 5,
      maxParticipants = 8
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Tournament name is required' });
      return;
    }

    try {
      const tournament = await prisma.tournament.create({
        data: {
          name,
          difficulty,
          timeLimit,
          roundsPerMatch,
          maxParticipants,
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
      const participantUsernames = tournament.participants.map(p => p.username);
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
