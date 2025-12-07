import { api } from './client.js';

export interface LeaderboardEntry {
	rank: number;
	username: string;
	displayName: string;
	points: number;
	streak?: number;
	distance?: number;
}

export interface StreakEntry {
	rank: number;
	username: string;
	displayName: string;
	currentStreak: number;
	maxStreak: number;
	points: number;
}

export interface UserStats {
	username: string;
	displayName: string;
	totalPoints: number;
	rank: number;
	currentStreak: number;
	maxStreak: number;
	playedToday: boolean;
	todayPoints: number | null;
	todayDistance: number | null;
}

/**
 * Get daily leaderboard
 */
export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
	const { data, error } = await api.get<LeaderboardEntry[]>('/api/leaderboard/daily');
	if (error) {
		console.error('Failed to get daily leaderboard:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Get all-time leaderboard
 */
export async function getTotalLeaderboard(): Promise<LeaderboardEntry[]> {
	const { data, error } = await api.get<LeaderboardEntry[]>('/api/leaderboard/total');
	if (error) {
		console.error('Failed to get total leaderboard:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(): Promise<StreakEntry[]> {
	const { data, error } = await api.get<StreakEntry[]>('/api/leaderboard/streaks');
	if (error) {
		console.error('Failed to get streak leaderboard:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Get current user's stats
 */
export async function getMyStats(): Promise<UserStats | null> {
	const { data, error } = await api.get<UserStats>('/api/leaderboard/me');
	if (error) {
		console.error('Failed to get user stats:', error);
		return null;
	}
	return data ?? null;
}
