import { api } from './client.js';

export interface Player {
	username: string;
	displayName: string;
	totalPoints: number;
}

export interface Challenge {
	id: number;
	opponent: string;
	opponentDisplayName: string;
	status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
	isChallenger: boolean;
	createdAt: string;
	yourScore?: number;
	theirScore?: number;
}

export interface ChallengesResponse {
	received: Challenge[];
	sent: Challenge[];
	active: Challenge[];
	completed: Challenge[];
}

export interface RoundPicture {
	roundNumber: number;
	pictureId: number;
	imageUrl: string;
}

export interface RoundResult {
	roundNumber: number;
	distance: number;
	points: number;
	actualLat: number;
	actualLng: number;
	placeName: string;
}

/**
 * Get available players to challenge
 */
export async function getAvailablePlayers(): Promise<Player[]> {
	const { data, error } = await api.get<Player[]>('/api/versus/players');
	if (error) {
		console.error('Failed to get players:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Get user's challenges
 */
export async function getChallenges(): Promise<ChallengesResponse> {
	const { data, error } = await api.get<ChallengesResponse>('/api/versus/challenges');
	if (error) {
		console.error('Failed to get challenges:', error);
		return { received: [], sent: [], active: [], completed: [] };
	}
	return data ?? { received: [], sent: [], active: [], completed: [] };
}

/**
 * Create a new challenge
 */
export async function createChallenge(opponentUsername: string): Promise<Challenge | null> {
	const { data, error } = await api.post<Challenge>('/api/versus/challenge', {
		opponentUsername
	});
	if (error) {
		console.error('Failed to create challenge:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Accept a challenge
 */
export async function acceptChallenge(challengeId: number): Promise<boolean> {
	const { error } = await api.post(`/api/versus/${challengeId}/accept`);
	if (error) {
		console.error('Failed to accept challenge:', error);
		return false;
	}
	return true;
}

/**
 * Decline a challenge
 */
export async function declineChallenge(challengeId: number): Promise<boolean> {
	const { error } = await api.post(`/api/versus/${challengeId}/decline`);
	if (error) {
		console.error('Failed to decline challenge:', error);
		return false;
	}
	return true;
}

/**
 * Get challenge details
 */
export async function getChallenge(challengeId: number): Promise<Challenge | null> {
	const { data, error } = await api.get<Challenge>(`/api/versus/${challengeId}`);
	if (error) {
		console.error('Failed to get challenge:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get round pictures for a challenge
 */
export async function getChallengeRounds(challengeId: number): Promise<RoundPicture[]> {
	const { data, error } = await api.get<RoundPicture[]>(`/api/versus/${challengeId}/rounds`);
	if (error) {
		console.error('Failed to get rounds:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Submit a round guess
 */
export async function submitChallengeRound(
	challengeId: number,
	roundNumber: number,
	latitude: number,
	longitude: number,
	timeSeconds: number
): Promise<RoundResult | null> {
	const { data, error } = await api.post<RoundResult>(`/api/versus/${challengeId}/submit`, {
		roundNumber,
		latitude,
		longitude,
		timeSeconds
	});
	if (error) {
		console.error('Failed to submit round:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get challenge results
 */
export async function getChallengeResults(challengeId: number) {
	const { data, error } = await api.get(`/api/versus/${challengeId}/results`);
	if (error) {
		console.error('Failed to get results:', error);
		return null;
	}
	return data;
}
