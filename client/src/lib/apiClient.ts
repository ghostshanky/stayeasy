import toast from 'react-hot-toast';

/**
 * Centralized API Client for StayEasy
 * Provides consistent error handling, request/response transformation, and type safety
 */

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    pagination?: {
        currentPage: number;
        totalPages: number;
        total: number;
        limit: number;
    };
}

export interface APIClientConfig {
    baseURL?: string;
    timeout?: number;
    showToastOnError?: boolean;
}

class APIClient {
    private baseURL: string;
    private timeout: number;
    private showToastOnError: boolean;

    constructor(config: APIClientConfig = {}) {
        this.baseURL = config.baseURL || '';
        this.timeout = config.timeout || 30000;
        this.showToastOnError = config.showToastOnError ?? true;
    }

    /**
     * Get auth token from localStorage
     */
    private getAuthToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    /**
     * Build headers for request
     */
    private buildHeaders(customHeaders?: HeadersInit): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (customHeaders) {
            if (customHeaders instanceof Headers) {
                customHeaders.forEach((value, key) => {
                    headers[key] = value;
                });
            } else if (Array.isArray(customHeaders)) {
                customHeaders.forEach(([key, value]) => {
                    headers[key] = value;
                });
            } else {
                Object.assign(headers, customHeaders);
            }
        }

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle API errors consistently
     */
    private handleError(error: any, endpoint: string): never {
        console.error(`API Error [${endpoint}]:`, error);

        const errorMessage = error.message || 'An unexpected error occurred';

        if (this.showToastOnError) {
            toast.error(errorMessage);
        }

        throw error;
    }

    /**
     * Make HTTP request
     */
    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<APIResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers: this.buildHeaders(options.headers),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data: APIResponse<T> = await response.json();

            // Handle non-2xx responses
            if (!response.ok) {
                if (this.showToastOnError && data.error) {
                    toast.error(data.error.message);
                }
                return data;
            }

            return data;
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                const timeoutError = {
                    success: false,
                    error: {
                        code: 'TIMEOUT',
                        message: 'Request timed out. Please try again.',
                    },
                };
                if (this.showToastOnError) {
                    toast.error(timeoutError.error.message);
                }
                return timeoutError as APIResponse<T>;
            }

            return this.handleError(error, endpoint);
        }
    }

    /**
     * GET request
     */
    async get<T = any>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T = any>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T = any>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T = any>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }

    /**
     * PATCH request
     */
    async patch<T = any>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

// Create singleton instance
export const apiClient = new APIClient({
    baseURL: '/api',
    timeout: 30000,
    showToastOnError: true,
});

// Export class for custom instances
export default APIClient;
