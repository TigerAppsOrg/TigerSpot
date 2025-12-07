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

export interface StartRoundResponse {
	startedAt: string;
	elapsedSeconds: number;
	remainingSeconds: number;
}

export interface RoundResult {
	roundNumber: number;
	distance: number;
	points: number;
	actualLat: number;
	actualLng: number;
}

export interface ChallengeStatus {
	challengeId: number;
	status: string;
	challengerId: string;
	challengeeId: string;
	yourProgress: number;
	opponentProgress: number;
	totalRounds: number;
	yourFinished: boolean;
	opponentFinished: boolean;
	winnerId: string | null;
}

export interface VersusRoundDetail {
	roundNumber: number;
	imageUrl: string;
	actual: { lat: number; lng: number };
	you: {
		guess: { lat: number; lng: number };
		distance: number;
		points: number;
		time: number;
	} | null;
	opponent: {
		guess: { lat: number; lng: number };
		distance: number;
		points: number;
		time: number;
	} | null;
}

export interface ChallengeResults {
	challengeId: number;
	status: string;
	tiebreaker: 'time' | null;
	rounds: VersusRoundDetail[];
	you: {
		username: string;
		displayName: string;
		scores: number[];
		total: number;
		totalTime: number;
		finished: boolean;
	};
	opponent: {
		username: string;
		displayName: string;
		scores: number[];
		total: number;
		totalTime: number;
		finished: boolean;
	};
	winnerId: string | null;
	completedAt: string | null;
}

/**
 * Send heartbeat to update presence on versus page
 */
export async function sendHeartbeat(): Promise<boolean> {
	const { error } = await api.post('/api/versus/heartbeat');
	if (error) {
		console.error('Failed to send heartbeat:', error);
		return false;
	}
	return true;
}

/**
 * Get available players to challenge (only those currently on versus page)
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
 * Cancel a sent challenge
 */
export async function cancelChallenge(challengeId: number): Promise<boolean> {
	const { error } = await api.delete(`/api/versus/${challengeId}`);
	if (error) {
		console.error('Failed to cancel challenge:', error);
		return false;
	}
	return true;
}

/**
 * Forfeit an active match (opponent wins)
 */
export async function forfeitMatch(challengeId: number): Promise<boolean> {
	const { error } = await api.post(`/api/versus/${challengeId}/forfeit`);
	if (error) {
		console.error('Failed to forfeit match:', error);
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
 * Start a round (anti-cheat: records server-side start time)
 */
export async function startChallengeRound(
	challengeId: number,
	roundNumber: number
): Promise<StartRoundResponse | null> {
	const { data, error } = await api.post<StartRoundResponse>(
		`/api/versus/${challengeId}/start-round`,
		{ roundNumber }
	);
	if (error) {
		console.error('Failed to start round:', error);
		return null;
	}
	return data ?? null;
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
 * Get challenge status (for polling opponent progress)
 */
export async function getChallengeStatus(challengeId: number): Promise<ChallengeStatus | null> {
	const { data, error } = await api.get<ChallengeStatus>(`/api/versus/${challengeId}/status`);
	if (error) {
		console.error('Failed to get status:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get challenge results
 */
export async function getChallengeResults(challengeId: number): Promise<ChallengeResults | null> {
	const { data, error } = await api.get<ChallengeResults>(`/api/versus/${challengeId}/results`);
	if (error) {
		console.error('Failed to get results:', error);
		return null;
	}
	return data ?? null;
}
