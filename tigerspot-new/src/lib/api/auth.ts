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

// ============ DEV-ONLY FUNCTIONS ============

export interface DevUser {
	username: string;
	displayName: string;
	classYear?: string;
	isAdmin?: boolean;
	totalPoints?: number;
}

export interface DevUsersResponse {
	existingUsers: DevUser[];
	availableTestUsers: DevUser[];
}

/**
 * [DEV ONLY] Get list of users for dev testing
 */
export async function getDevUsers(): Promise<DevUsersResponse | null> {
	const { data, error } = await api.get<DevUsersResponse>('/api/auth/dev/users');
	if (error) {
		return null;
	}
	return data ?? null;
}

/**
 * [DEV ONLY] Login as a specific user (creates if doesn't exist)
 */
export async function devLogin(username: string): Promise<boolean> {
	const { error } = await api.post(`/api/auth/dev/login/${username}`, {});
	return !error;
}
