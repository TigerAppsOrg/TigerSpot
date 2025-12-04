import { writable } from 'svelte/store';

export interface GameResults {
	guessLat: number;
	guessLng: number;
	actualLat: number;
	actualLng: number;
	distance: number;
	points: number;
}

export const gameResults = writable<GameResults | null>(null);
