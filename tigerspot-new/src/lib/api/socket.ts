import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './client.js';

// Socket instances for different namespaces
let versusSocket: Socket | null = null;
let tournamentSocket: Socket | null = null;

// ==================== VERSUS MODE SOCKET ====================

export interface VersusMatchStartEvent {
	challengeId: number;
	rounds: Array<{ roundNumber: number; pictureId: number; imageUrl: string }>;
}

export interface VersusOpponentSubmittedEvent {
	roundNumber: number;
	opponentPoints: number;
	opponentTotalPoints: number;
}

export interface VersusRoundCompleteEvent {
	roundNumber: number;
	yourPoints: number;
	opponentPoints: number;
	yourTotal: number;
	opponentTotal: number;
	actualLat: number;
	actualLng: number;
}

export interface VersusMatchCompleteEvent {
	winner: string | null;
	yourTotal: number;
	opponentTotal: number;
}

type VersusEventHandlers = {
	onOpponentJoined?: () => void;
	onOpponentLeft?: () => void;
	onOpponentReady?: () => void;
	onMatchStart?: (data: VersusMatchStartEvent) => void;
	onOpponentSubmitted?: (data: VersusOpponentSubmittedEvent) => void;
	onRoundComplete?: (data: VersusRoundCompleteEvent) => void;
	onMatchComplete?: (data: VersusMatchCompleteEvent) => void;
	onError?: (error: { message: string }) => void;
};

/**
 * Connect to versus mode socket
 */
export function connectVersus(handlers: VersusEventHandlers = {}): Socket {
	if (versusSocket?.connected) {
		return versusSocket;
	}

	versusSocket = io(`${API_BASE_URL}/versus`, {
		withCredentials: true,
		transports: ['websocket', 'polling']
	});

	versusSocket.on('connect', () => {
		console.log('Connected to versus socket');
	});

	versusSocket.on('disconnect', () => {
		console.log('Disconnected from versus socket');
	});

	// Event handlers
	if (handlers.onOpponentJoined) {
		versusSocket.on('versus:opponent_joined', handlers.onOpponentJoined);
	}
	if (handlers.onOpponentLeft) {
		versusSocket.on('versus:opponent_left', handlers.onOpponentLeft);
	}
	if (handlers.onOpponentReady) {
		versusSocket.on('versus:opponent_ready', handlers.onOpponentReady);
	}
	if (handlers.onMatchStart) {
		versusSocket.on('versus:match_start', handlers.onMatchStart);
	}
	if (handlers.onOpponentSubmitted) {
		versusSocket.on('versus:opponent_submitted', handlers.onOpponentSubmitted);
	}
	if (handlers.onRoundComplete) {
		versusSocket.on('versus:round_complete', handlers.onRoundComplete);
	}
	if (handlers.onMatchComplete) {
		versusSocket.on('versus:match_complete', handlers.onMatchComplete);
	}
	if (handlers.onError) {
		versusSocket.on('versus:error', handlers.onError);
	}

	return versusSocket;
}

/**
 * Join a challenge room
 */
export function joinChallenge(challengeId: number): void {
	versusSocket?.emit('versus:join', { challengeId });
}

/**
 * Leave a challenge room
 */
export function leaveChallenge(challengeId: number): void {
	versusSocket?.emit('versus:leave', { challengeId });
}

/**
 * Signal ready to start
 */
export function versusReady(challengeId: number): void {
	versusSocket?.emit('versus:ready', { challengeId });
}

/**
 * Submit round guess via socket (for real-time updates)
 */
export function versusSubmitRound(
	challengeId: number,
	roundNumber: number,
	latitude: number,
	longitude: number,
	timeSeconds: number
): void {
	versusSocket?.emit('versus:submit', {
		challengeId,
		roundNumber,
		latitude,
		longitude,
		timeSeconds
	});
}

/**
 * Disconnect versus socket
 */
export function disconnectVersus(): void {
	versusSocket?.disconnect();
	versusSocket = null;
}

// ==================== TOURNAMENT MODE SOCKET ====================

export interface TournamentStartedEvent {
	tournamentId: number;
	bracket: unknown; // Full bracket structure
}

export interface TournamentMatchReadyEvent {
	matchId: number;
	player1: string;
	player1DisplayName: string;
	player2: string;
	player2DisplayName: string;
}

export interface TournamentScoreUpdateEvent {
	matchId: number;
	player1Score: number;
	player2Score: number;
	currentRound: number;
}

export interface TournamentMatchCompletedEvent {
	matchId: number;
	winnerId: string;
	loserId: string;
	player1Score: number;
	player2Score: number;
}

export interface TournamentBracketUpdatedEvent {
	tournamentId: number;
	bracket: unknown;
	changedMatches: number[];
}

export interface TournamentCompletedEvent {
	tournamentId: number;
	winnerId: string;
	winnerDisplayName: string;
}

type TournamentEventHandlers = {
	onTournamentStarted?: (data: TournamentStartedEvent) => void;
	onMatchReady?: (data: TournamentMatchReadyEvent) => void;
	onOpponentJoined?: () => void;
	onScoreUpdate?: (data: TournamentScoreUpdateEvent) => void;
	onMatchCompleted?: (data: TournamentMatchCompletedEvent) => void;
	onBracketUpdated?: (data: TournamentBracketUpdatedEvent) => void;
	onTournamentCompleted?: (data: TournamentCompletedEvent) => void;
	onPlayerEliminated?: (data: { username: string; placement: number }) => void;
};

/**
 * Connect to tournament mode socket
 */
export function connectTournament(handlers: TournamentEventHandlers = {}): Socket {
	if (tournamentSocket?.connected) {
		return tournamentSocket;
	}

	tournamentSocket = io(`${API_BASE_URL}/tournament`, {
		withCredentials: true,
		transports: ['websocket', 'polling']
	});

	tournamentSocket.on('connect', () => {
		console.log('Connected to tournament socket');
	});

	tournamentSocket.on('disconnect', () => {
		console.log('Disconnected from tournament socket');
	});

	// Event handlers
	if (handlers.onTournamentStarted) {
		tournamentSocket.on('tournament:started', handlers.onTournamentStarted);
	}
	if (handlers.onMatchReady) {
		tournamentSocket.on('tournament:match_ready', handlers.onMatchReady);
	}
	if (handlers.onOpponentJoined) {
		tournamentSocket.on('tournament:opponent_joined', handlers.onOpponentJoined);
	}
	if (handlers.onScoreUpdate) {
		tournamentSocket.on('tournament:score_update', handlers.onScoreUpdate);
	}
	if (handlers.onMatchCompleted) {
		tournamentSocket.on('tournament:match_completed', handlers.onMatchCompleted);
	}
	if (handlers.onBracketUpdated) {
		tournamentSocket.on('tournament:bracket_updated', handlers.onBracketUpdated);
	}
	if (handlers.onTournamentCompleted) {
		tournamentSocket.on('tournament:completed', handlers.onTournamentCompleted);
	}
	if (handlers.onPlayerEliminated) {
		tournamentSocket.on('tournament:player_eliminated', handlers.onPlayerEliminated);
	}

	return tournamentSocket;
}

/**
 * Join tournament room (for bracket updates)
 */
export function joinTournamentRoom(tournamentId: number): void {
	tournamentSocket?.emit('tournament:join', { tournamentId });
}

/**
 * Leave tournament room
 */
export function leaveTournamentRoom(tournamentId: number): void {
	tournamentSocket?.emit('tournament:leave', { tournamentId });
}

/**
 * Join specific match room
 */
export function joinMatchRoom(matchId: number): void {
	tournamentSocket?.emit('tournament:match_join', { matchId });
}

/**
 * Submit round guess via socket
 */
export function tournamentSubmitRound(
	matchId: number,
	roundNumber: number,
	latitude: number,
	longitude: number,
	timeSeconds: number
): void {
	tournamentSocket?.emit('tournament:submit', {
		matchId,
		roundNumber,
		latitude,
		longitude,
		timeSeconds
	});
}

/**
 * Disconnect tournament socket
 */
export function disconnectTournament(): void {
	tournamentSocket?.disconnect();
	tournamentSocket = null;
}

// ==================== UTILITY ====================

/**
 * Disconnect all sockets
 */
export function disconnectAll(): void {
	disconnectVersus();
	disconnectTournament();
}
