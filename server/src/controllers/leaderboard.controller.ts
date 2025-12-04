import type { Response } from 'express';
import { prisma } from '../config/database.js';
import type { AuthRequest } from '../types/index.js';

export class LeaderboardController {
  /**
   * Get daily leaderboard
   */
  getDaily = async (_req: AuthRequest, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const leaderboard = await prisma.userDaily.findMany({
        where: {
          lastPlayed: {
            gte: today
          }
        },
        orderBy: { points: 'desc' },
        take: 20,
        include: {
          user: {
            select: { displayName: true }
          }
        }
      });

      res.json(
        leaderboard.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          displayName: entry.user.displayName,
          points: entry.points,
          distance: entry.distance
        }))
      );
    } catch (error) {
      console.error('Error getting daily leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  };

  /**
   * Get all-time leaderboard
   */
  getTotal = async (_req: AuthRequest, res: Response) => {
    try {
      const leaderboard = await prisma.user.findMany({
        orderBy: { totalPoints: 'desc' },
        take: 50,
        select: {
          username: true,
          displayName: true,
          totalPoints: true,
          daily: {
            select: { currentStreak: true }
          }
        }
      });

      res.json(
        leaderboard.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          displayName: entry.displayName,
          points: entry.totalPoints,
          streak: entry.daily?.currentStreak || 0
        }))
      );
    } catch (error) {
      console.error('Error getting total leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  };

  /**
   * Get streak leaderboard
   */
  getStreaks = async (_req: AuthRequest, res: Response) => {
    try {
      const leaderboard = await prisma.userDaily.findMany({
        where: {
          currentStreak: { gt: 0 }
        },
        orderBy: { currentStreak: 'desc' },
        take: 20,
        include: {
          user: {
            select: { displayName: true, totalPoints: true }
          }
        }
      });

      res.json(
        leaderboard.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          displayName: entry.user.displayName,
          currentStreak: entry.currentStreak,
          maxStreak: entry.maxStreak,
          points: entry.user.totalPoints
        }))
      );
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  };

  /**
   * Get current user's stats
   */
  getMyStats = async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: req.user!.username },
        include: { daily: true }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user's rank
      const usersAbove = await prisma.user.count({
        where: {
          totalPoints: { gt: user.totalPoints }
        }
      });

      // Get today's challenge stats if played
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const playedToday =
        user.daily?.lastPlayed &&
        new Date(user.daily.lastPlayed).setHours(0, 0, 0, 0) === today.getTime();

      res.json({
        username: user.username,
        displayName: user.displayName,
        totalPoints: user.totalPoints,
        rank: usersAbove + 1,
        currentStreak: user.daily?.currentStreak || 0,
        maxStreak: user.daily?.maxStreak || 0,
        playedToday,
        todayPoints: playedToday ? user.daily?.points : null,
        todayDistance: playedToday ? user.daily?.distance : null
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  };
}
