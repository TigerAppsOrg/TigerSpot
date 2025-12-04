import { getCurrentUser, login, logout, type User } from '$lib/api/auth.js';

// User state using Svelte 5 runes pattern with a class
class UserStore {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);

	get isAuthenticated() {
		return this.user !== null;
	}

	get isAdmin() {
		return this.user?.isAdmin ?? false;
	}

	get displayName() {
		return this.user?.displayName ?? 'Guest';
	}

	get username() {
		return this.user?.username ?? '';
	}

	/**
	 * Load user from API (checks auth cookie)
	 */
	async load() {
		this.loading = true;
		this.error = null;

		try {
			const user = await getCurrentUser();
			this.user = user;
		} catch (e) {
			this.error = 'Failed to load user';
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Redirect to CAS login
	 */
	login() {
		login();
	}

	/**
	 * Logout and redirect to CAS logout
	 */
	logout() {
		this.user = null;
		logout();
	}

	/**
	 * Check if user is authenticated, redirect to login if not
	 */
	requireAuth(): boolean {
		if (!this.isAuthenticated && !this.loading) {
			this.login();
			return false;
		}
		return true;
	}
}

export const userStore = new UserStore();
