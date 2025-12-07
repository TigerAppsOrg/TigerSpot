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
}

export interface DailyStatus {
	hasPlayed: boolean;
	currentStreak: number;
	maxStreak: number;
	todayPoints: number | null;
	todayDistance: number | null;
}

export interface StartChallengeResponse {
	startedAt: string;
	elapsedSeconds: number;
	remainingSeconds: number;
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
 * Start today's challenge (anti-cheat: records server-side start time)
 */
export async function startDailyChallenge(): Promise<StartChallengeResponse | null> {
	const { data, error } = await api.post<StartChallengeResponse>('/api/game/start');
	if (error) {
		console.error('Failed to start challenge:', error);
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

export interface TodayResult extends GameResult {
	currentStreak: number;
}

/**
 * Get today's result for a user who has already played
 */
export async function getTodayResult(): Promise<TodayResult | null> {
	const { data, error } = await api.get<TodayResult>('/api/game/result');
	if (error) {
		console.error('Failed to get today result:', error);
		return null;
	}
	return data ?? null;
}
