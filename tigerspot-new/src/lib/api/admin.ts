import { api } from './client.js';

export interface Picture {
	id: number;
	cloudinaryId: string;
	imageUrl: string;
	latitude: number;
	longitude: number;
	placeName: string;
	difficulty: 'EASY' | 'MEDIUM' | 'HARD';
	createdAt: string;
	uploader?: {
		displayName: string;
	};
}

export interface AdminUser {
	username: string;
	displayName: string;
	email: string | null;
	classYear: string | null;
	totalPoints: number;
	isAdmin: boolean;
	createdAt: string;
}

export interface ImageUploadResult {
	success: boolean;
	picture?: Picture;
	uploadResult?: {
		publicId: string;
		url: string;
	};
	exifExtracted: boolean;
	requiresCoordinates?: boolean;
	message?: string;
}

export interface CreateTournamentData {
	name: string;
	difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
	timeLimit?: number;
	roundsPerMatch?: number;
	maxParticipants?: number;
}

/**
 * List all images
 * NOTE: Cloudinary credentials are never exposed - all image operations go through the server
 */
export async function listImages(): Promise<Picture[]> {
	const { data, error } = await api.get<Picture[]>('/api/admin/images');
	if (error) {
		console.error('Failed to list images:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Upload an image
 * The server extracts EXIF GPS data and uploads to Cloudinary
 * Cloudinary API keys are NEVER sent to the frontend
 */
export async function uploadImage(
	file: File,
	placeName?: string,
	difficulty?: 'EASY' | 'MEDIUM' | 'HARD',
	coordinates?: { lat: number; lng: number }
): Promise<ImageUploadResult | null> {
	const formData = new FormData();
	formData.append('image', file);
	if (placeName) formData.append('placeName', placeName);
	if (difficulty) formData.append('difficulty', difficulty);
	if (coordinates) {
		formData.append('latitude', coordinates.lat.toString());
		formData.append('longitude', coordinates.lng.toString());
	}

	const { data, error } = await api.uploadFile<ImageUploadResult>(
		'/api/admin/images/upload',
		formData
	);
	if (error) {
		console.error('Failed to upload image:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Update image metadata
 */
export async function updateImage(
	id: number,
	updates: {
		latitude?: number;
		longitude?: number;
		placeName?: string;
		difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
	}
): Promise<Picture | null> {
	const { data, error } = await api.put<Picture>(`/api/admin/images/${id}`, updates);
	if (error) {
		console.error('Failed to update image:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Delete an image
 */
export async function deleteImage(id: number): Promise<boolean> {
	const { error } = await api.delete(`/api/admin/images/${id}`);
	if (error) {
		console.error('Failed to delete image:', error);
		return false;
	}
	return true;
}

/**
 * List all users
 */
export async function listUsers(): Promise<AdminUser[]> {
	const { data, error } = await api.get<AdminUser[]>('/api/admin/users');
	if (error) {
		console.error('Failed to list users:', error);
		return [];
	}
	return data ?? [];
}

/**
 * Update user (e.g., grant/revoke admin)
 */
export async function updateUser(
	username: string,
	updates: { isAdmin?: boolean }
): Promise<AdminUser | null> {
	const { data, error } = await api.patch<AdminUser>(`/api/admin/users/${username}`, updates);
	if (error) {
		console.error('Failed to update user:', error);
		return null;
	}
	return data ?? null;
}

/**
 * Create a tournament
 */
export async function createTournament(data: CreateTournamentData) {
	const { data: result, error } = await api.post('/api/admin/tournament', data);
	if (error) {
		console.error('Failed to create tournament:', error);
		return null;
	}
	return result;
}

/**
 * Start a tournament
 */
export async function startTournament(tournamentId: number): Promise<boolean> {
	const { error } = await api.post(`/api/admin/tournament/${tournamentId}/start`);
	if (error) {
		console.error('Failed to start tournament:', error);
		return false;
	}
	return true;
}

/**
 * Cancel a tournament
 */
export async function cancelTournament(tournamentId: number): Promise<boolean> {
	const { error } = await api.post(`/api/admin/tournament/${tournamentId}/cancel`);
	if (error) {
		console.error('Failed to cancel tournament:', error);
		return false;
	}
	return true;
}

/**
 * Set daily challenge for a specific date
 */
export async function setDailyChallenge(pictureId: number, date?: string): Promise<boolean> {
	const { error } = await api.post('/api/admin/daily/set', { pictureId, date });
	if (error) {
		console.error('Failed to set daily challenge:', error);
		return false;
	}
	return true;
}
