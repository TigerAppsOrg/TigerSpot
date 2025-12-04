import type { Request } from 'express';

export interface AuthUser {
	username: string;
	displayName: string;
	email: string | null;
	classYear: string | null;
	isAdmin: boolean;
}

export interface AuthRequest extends Request {
	user?: AuthUser;
}

export interface CASUserData {
	netid: string;
	displayName: string;
	email: string | null;
	classYear: string | null;
}

export interface JWTPayload {
	username: string;
	isAdmin: boolean;
	iat?: number;
	exp?: number;
}

// Game types
export interface GameSubmission {
	latitude: number;
	longitude: number;
	timeSeconds?: number;
}

export interface RoundResult {
	roundNumber: number;
	pictureId: number;
	guessLat: number;
	guessLng: number;
	actualLat: number;
	actualLng: number;
	distance: number;
	points: number;
	timeSeconds: number;
}

// Versus types
export interface ChallengeResponse {
	id: number;
	opponent: string;
	opponentDisplayName: string;
	status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
	isChallenger: boolean;
	createdAt: Date;
	yourScore?: number;
	theirScore?: number;
}

// Tournament types
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

export interface TournamentResponse {
	id: number;
	name: string;
	status: 'open' | 'in_progress' | 'completed';
	difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
	timeLimit: number;
	roundsPerMatch: number;
	participants: number;
	maxParticipants: number;
	createdAt: Date;
	winner?: string;
}
