import { api, API_BASE_URL } from './client.js';

export interface User {
	username: string;
	displayName: string;
	email: string | null;
	classYear: string | null;
	totalPoints: number;
	currentStreak: number;
	isAdmin: boolean;
}

/**
 * Redirect to Princeton CAS login
 */
export function login(): void {
	window.location.href = `${API_BASE_URL}/api/auth/login`;
}

/**
 * Logout and redirect to CAS logout
 */
export function logout(): void {
	window.location.href = `${API_BASE_URL}/api/auth/logout`;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
	const { data, error } = await api.get<User>('/api/auth/me');
	if (error) {
		return null;
	}
	return data ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
	const user = await getCurrentUser();
	return user !== null;
}
