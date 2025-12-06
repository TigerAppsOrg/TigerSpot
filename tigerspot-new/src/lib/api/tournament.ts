import { api } from './client.js';
import type { RoundPicture, RoundResult } from './versus.js';
export type { RoundPicture, RoundResult };

export interface Tournament {
	id: number;
	name: string;
	status: 'open' | 'in_progress' | 'completed';
	difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
	timeLimit: number;
	roundsPerMatch: number;
	participants: number;
	maxParticipants: number | null; // null = unlimited
	createdAt: string;
	winner?: string;
}

export interface TournamentParticipant {
	username: string;
	displayName: string;
	seed: number | null;
	eliminated: boolean;
	lossCount: number;
}

export interface BracketMatch {
	id: number;
	player1: string | null;
	player1DisplayName: string | null;
	player2: string | null;
	player2DisplayName: string | null;
	player1Score: number | null;
	player2Score: number | null;
	winnerId: string | null;
	status: 'pending' | 'ready' | 'in_progress' | 'completed';
}

export interface Bracket {
	winners: BracketMatch[][];
	losers: BracketMatch[][];
	grandFinal: BracketMatch;
}

export interface TournamentDetails extends Omit<Tournament, 'participants'> {
	createdBy: string;
	startedAt: string | null;
	completedAt: string | null;
	participants: TournamentParticipant[];
	bracket: Bracket;
}

/**
 * List all tournaments
 */
export async function listTournaments(): Promise<Tournament[]> {
	const { data, error } = await api.get<Tournament[]>('/api/tournament');
	if (error) {
		console.error('Failed to list tournaments:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Get tournament details with bracket
 */
export async function getTournament(id: number): Promise<TournamentDetails | null> {
	const { data, error } = await api.get<TournamentDetails>(`/api/tournament/${id}`);
	if (error) {
		console.error('Failed to get tournament:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Join a tournament
 */
export async function joinTournament(tournamentId: number): Promise<boolean> {
	const { error } = await api.post(`/api/tournament/${tournamentId}/join`);
	if (error) {
		console.error('Failed to join tournament:', error);
		return false;
	}
	return true;
}

/**
 * Leave a tournament
 */
export async function leaveTournament(tournamentId: number): Promise<boolean> {
	const { error } = await api.post(`/api/tournament/${tournamentId}/leave`);
	if (error) {
		console.error('Failed to leave tournament:', error);
		return false;
	}
	return true;
}

/**
 * Get bracket state
 */
export async function getBracket(tournamentId: number): Promise<Bracket | null> {
	const { data, error } = await api.get<Bracket>(`/api/tournament/${tournamentId}/bracket`);
	if (error) {
		console.error('Failed to get bracket:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get match rounds (pictures)
 */
export async function getMatchRounds(
	tournamentId: number,
	matchId: number
): Promise<RoundPicture[]> {
	const { data, error } = await api.get<RoundPicture[]>(
		`/api/tournament/${tournamentId}/match/${matchId}/rounds`
	);
	if (error) {
		console.error('Failed to get match rounds:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Submit a round guess for tournament match
 */
export async function submitMatchRound(
	tournamentId: number,
	matchId: number,
	roundNumber: number,
	latitude: number,
	longitude: number,
	timeSeconds: number
): Promise<RoundResult | null> {
	const { data, error } = await api.post<RoundResult>(
		`/api/tournament/${tournamentId}/match/${matchId}/submit`,
		{
			roundNumber,
			latitude,
			longitude,
			timeSeconds
		}
	);
	if (error) {
		console.error('Failed to submit round:', error);
		return null;
	}
	return data ?? null;
}
