import { writable } from 'svelte/store';

export interface SoloRoundResult {
	pictureId: number;
	imageUrl: string;
	guessLat: number | null;
	guessLng: number | null;
	actualLat: number;
	actualLng: number;
	distance: number;
	points: number;
	timedOut?: boolean;
}

export interface SoloResults {
	rounds: SoloRoundResult[];
	totalPoints: number;
}

export const soloResults = writable<SoloResults | null>(null);
