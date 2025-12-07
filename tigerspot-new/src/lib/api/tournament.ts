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
	joinCode?: string; // Only included for admins
	joined?: boolean; // Whether current user has joined this tournament
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
export async function joinTournament(
	tournamentId: number,
	joinCode: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await api.post(`/api/tournament/${tournamentId}/join`, { joinCode });
	if (error) {
		console.error('Failed to join tournament:', error);
		return { success: false, error: error || 'Failed to join tournament' };
	}
	return { success: true };
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

export interface MatchDetails {
	id: number;
	player1Id: string | null;
	player2Id: string | null;
	player1: { displayName: string } | null;
	player2: { displayName: string } | null;
	tournament: { timeLimit: number; roundsPerMatch: number };
	status: string;
}

/**
 * Get match details
 */
export async function getMatch(
	tournamentId: number,
	matchId: number
): Promise<MatchDetails | null> {
	const { data, error } = await api.get<MatchDetails>(
		`/api/tournament/${tournamentId}/match/${matchId}`
	);
	if (error) {
		console.error('Failed to get match:', error);
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

export interface MatchResults {
	matchId: number;
	tournamentId: number;
	status: string;
	bracketType: 'WINNERS' | 'LOSERS' | 'GRAND_FINAL';
	you: {
		username: string;
		displayName: string;
		scores: number[];
		total: number;
		finished: boolean;
	};
	opponent: {
		username: string;
		displayName: string;
		scores: number[];
		total: number;
		finished: boolean;
	};
	winnerId: string | null;
	completedAt: string | null;
}

export interface MatchStatus {
	matchId: number;
	status: string;
	player1Id: string | null;
	player2Id: string | null;
	player1Progress: number;
	player2Progress: number;
	totalRounds: number;
	player1Finished: boolean;
	player2Finished: boolean;
	winnerId: string | null;
}

/**
 * Get match results with both players' scores
 */
export async function getMatchResults(
	tournamentId: number,
	matchId: number
): Promise<MatchResults | null> {
	const { data, error } = await api.get<MatchResults>(
		`/api/tournament/${tournamentId}/match/${matchId}/results`
	);
	if (error) {
		console.error('Failed to get match results:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Get match status (for polling while waiting)
 */
export async function getMatchStatus(
	tournamentId: number,
	matchId: number
): Promise<MatchStatus | null> {
	const { data, error } = await api.get<MatchStatus>(
		`/api/tournament/${tournamentId}/match/${matchId}/status`
	);
	if (error) {
		console.error('Failed to get match status:', error);
		return null;
	}
	return data ?? null;
}
