import { writable } from 'svelte/store';

export interface GameResults {
	guessLat: number | null;
	guessLng: number | null;
	actualLat: number;
	actualLng: number;
	distance: number;
	points: number;
	timedOut?: boolean;
}

export const gameResults = writable<GameResults | null>(null);
