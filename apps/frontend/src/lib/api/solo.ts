import { api } from './client.js';

export interface SoloRound {
	id: number;
	imageUrl: string;
}

export interface SoloGuessResult {
	distance: number;
	points: number;
	actualLat: number;
	actualLng: number;
}

export async function getSoloRounds(count: number = 5): Promise<SoloRound[]> {
	const { data, error } = await api.get<SoloRound[]>(`/api/solo/rounds?count=${count}`);
	if (error) {
		console.error('Failed to get solo rounds:', error);
		return [];
	}
	return data ?? [];
}

export async function submitSoloGuess(
	pictureId: number,
	guessLat: number,
	guessLng: number
): Promise<SoloGuessResult | null> {
	const { data, error } = await api.post<SoloGuessResult>('/api/solo/submit', {
		pictureId,
		guessLat,
		guessLng
	});
	if (error) {
		console.error('Failed to submit solo guess:', error);
		return null;
	}
	return data ?? null;
}
