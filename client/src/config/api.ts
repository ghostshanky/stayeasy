import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3002/api' : '/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;


// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Enhanced API client class
class ApiClient {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        
        console.log('🔍 [Client Request] Checking token for:', config.url);
        console.log('🔍 [Client Request] Token found:', !!token);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ [Client Request] Using token');
        } else {
          console.log('⚠️ [Client Request] No token found');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ [Client Response] Success:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.log('❌ [Client Response] Error:', error.response?.status, error.config?.url);
        
        if (error.response?.status === 401) {
          console.log('🔄 [Client Response] 401 Unauthorized - clearing tokens');
          // Clear all auth tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('authToken');
          window.location.href = '/auth';
        } else if (error.response) {
          console.log('❌ [Client Response] Other error:', error.response.status, error.response.data);
        } else {
          console.log('❌ [Client Response] Network error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any) {
    if (error.response?.data?.message) {
      throw new ApiError(
        error.response.data.message,
        error.response.data.code,
        error.response.status,
        error.response.data
      );
    }
    throw new ApiError(error.message || 'An unknown error occurred');
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_CONFIG);

// Debug function to check authentication status
export const checkAuthStatus = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  console.log('🔍 [Auth Debug] Current authentication status:');
  console.log('🔍 [Auth Debug] Access token:', !!accessToken);
  console.log('🔍 [Auth Debug] Refresh token:', !!refreshToken);
  console.log('🔍 [Auth Debug] API Base URL:', API_CONFIG.baseURL);
  return { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken };
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  properties: {
    list: '/properties',
    details: (id: string) => `/properties/${id}`,
    create: '/properties',
    update: (id: string) => `/properties/${id}`,
    delete: (id: string) => `/properties/${id}`,
  },
  bookings: {
    list: '/bookings',
    details: (id: string) => `/bookings/${id}`,
    create: '/bookings',
    update: (id: string) => `/bookings/${id}`,
    delete: (id: string) => `/bookings/${id}`,
  },
  payments: {
    list: '/payments',
    details: (id: string) => `/payments/${id}`,
    create: '/payments',
    verify: (id: string) => `/payments/${id}/verify`,
  },
  messages: {
    list: '/messages',
    details: (id: string) => `/messages/${id}`,
    send: '/messages/send',
  },
  reviews: {
    list: '/reviews',
    create: '/reviews',
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
  },
} as const;