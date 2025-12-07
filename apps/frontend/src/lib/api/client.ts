// API client configuration
// All Cloudinary operations happen server-side - credentials are never exposed to frontend

// Use same hostname as frontend so it works on local network
const getApiBaseUrl = () => {
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}
	// In browser, use same host as frontend (works for localhost and local network IP)
	if (typeof window !== 'undefined') {
		return `http://${window.location.hostname}:3001`;
	}
	return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
	data?: T;
	error?: string;
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				...options,
				credentials: 'include', // Include cookies for auth
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.error || `HTTP ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('API request failed:', error);
			return { error: 'Network error' };
		}
	}

	async get<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined
		});
	}

	async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: body ? JSON.stringify(body) : undefined
		});
	}

	async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: body ? JSON.stringify(body) : undefined
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}

	// Special method for file uploads (multipart/form-data)
	async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				method: 'POST',
				credentials: 'include',
				body: formData
				// Don't set Content-Type - browser will set it with boundary
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.error || `HTTP ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Upload failed:', error);
			return { error: 'Upload failed' };
		}
	}
}

export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };
