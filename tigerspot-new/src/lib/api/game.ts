import { api } from './client.js';

export interface DailyChallenge {
	id: number;
	imageUrl: string;
	hasPlayed: boolean;
}

export interface GameResult {
	guessLat: number;
	guessLng: number;
	actualLat: number;
	actualLng: number;
	distance: number;
	points: number;
	placeName: string;
}

export interface DailyStatus {
	hasPlayed: boolean;
	currentStreak: number;
	maxStreak: number;
	todayPoints: number | null;
	todayDistance: number | null;
}

/**
 * Get today's daily challenge
 */
export async function getTodayChallenge(): Promise<DailyChallenge | null> {
	const { data, error } = await api.get<DailyChallenge>('/api/game/today');
	if (error) {
		console.error('Failed to get today challenge:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Submit guess for daily challenge
 */
export async function submitDailyGuess(
	latitude: number,
	longitude: number
): Promise<GameResult | null> {
	const { data, error } = await api.post<GameResult>('/api/game/submit', {
		latitude,
		longitude
	});
	if (error) {
		console.error('Failed to submit guess:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get daily status (has played, streak, etc.)
 */
export async function getDailyStatus(): Promise<DailyStatus | null> {
	const { data, error } = await api.get<DailyStatus>('/api/game/status');
	if (error) {
		console.error('Failed to get daily status:', error);
		return null;
	}
	return data ?? null;
}
