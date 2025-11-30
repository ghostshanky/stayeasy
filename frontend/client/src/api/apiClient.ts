import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  ApiError, 
  ApiConfig, 
  ApiRequestConfig, 
  AsyncState,
  AppError,
  ErrorType,
  ErrorSeverity 
} from '../types';
import { errorHandler } from '../utils/errorHandler';

// Default API configuration
const defaultConfig: ApiConfig = {
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Enhanced API client class
export class ApiClient {
  private instance: AxiosInstance;
  private config: ApiConfig;
  private requestInterceptors: number[] = [];
  private responseInterceptors: number[] = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.instance = axios.create(this.config);
    this.setupInterceptors();
  }

  // Setup request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    const requestInterceptor = this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    const responseInterceptor = this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );

    this.requestInterceptors.push(requestInterceptor);
    this.responseInterceptors.push(responseInterceptor);
  }

  // Handle API errors
  private handleApiError(error: AxiosError): void {
    const appError = this.transformApiError(error);
    console.error('API Error:', appError);
  }

  // Transform API error to AppError
  private transformApiError(error: AxiosError): AppError {
    const status = error.response?.status || 0;
    const responseData = error.response?.data || {};
    const message = (responseData as any)?.message || error.message || 'Unknown error occurred';
    const code = (responseData as any)?.code || 'UNKNOWN_ERROR';
    const details = (responseData as any)?.details || responseData;

    let type: ErrorType = ErrorType.UNKNOWN_ERROR;
    let severity: ErrorSeverity = ErrorSeverity.MEDIUM;

    switch (status) {
      case 400:
        type = ErrorType.VALIDATION_ERROR;
        severity = ErrorSeverity.LOW;
        break;
      case 401:
        type = ErrorType.AUTH_ERROR;
        severity = ErrorSeverity.HIGH;
        break;
      case 403:
        type = ErrorType.PERMISSION_DENIED;
        severity = ErrorSeverity.HIGH;
        break;
      case 404:
        type = ErrorType.NOT_FOUND;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER_ERROR;
        severity = ErrorSeverity.CRITICAL;
        break;
      case 0:
      case -1:
        type = ErrorType.NETWORK_ERROR;
        severity = ErrorSeverity.HIGH;
        break;
      case 408:
        type = ErrorType.TIMEOUT_ERROR;
        severity = ErrorSeverity.MEDIUM;
        break;
      default:
        type = ErrorType.UNKNOWN_ERROR;
        severity = ErrorSeverity.MEDIUM;
    }

    return {
      type,
      severity,
      message,
      code,
      details,
      timestamp: new Date(),
      stack: error.stack,
    };
  }

  // Generic request method
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: { ...this.config.headers, ...config.headers },
        timeout: config.timeout || this.config.timeout,
      };

      console.log('🔍 [API Client] Making request:', {
        method: config.method,
        url: config.url,
        baseURL: this.config.baseURL,
        hasData: !!config.data,
        timeout: axiosConfig.timeout
      });

      const response = await this.instance.request<ApiResponse<T>>(axiosConfig);
      
      console.log('🔍 [API Client] Response received:', {
        status: response.status,
        hasData: !!response.data,
        success: response.data?.success,
        hasError: !!response.data?.error,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // Ensure the response has the expected structure
      const responseData = response.data;
      if (!responseData || typeof responseData !== 'object') {
        console.error('❌ [API Client] Invalid response format:', responseData);
        throw new Error('Invalid response format');
      }
      
      return responseData;
    } catch (error) {
      console.error('❌ [API Client] Request failed:', {
        error: error instanceof Error ? error.message : error,
        config: {
          method: config.method,
          url: config.url,
          baseURL: this.config.baseURL
        }
      });
      throw error;
    }
  }

  // GET request
  async get<T = any>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: Omit<ApiRequestConfig, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: Omit<ApiRequestConfig, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: Omit<ApiRequestConfig, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  // DELETE request
  async delete<T = any>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  // File upload
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    try {
      const response = await this.instance.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.instance.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error;
    }
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.instance.defaults.headers.Authorization = `Bearer ${token}`;
  }

  // Clear auth token
  clearAuthToken(): void {
    delete this.instance.defaults.headers.Authorization;
  }

  // Update config
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
    this.instance.defaults.baseURL = this.config.baseURL;
    this.instance.defaults.timeout = this.config.timeout;
    this.instance.defaults.headers = { ...this.instance.defaults.headers, ...this.config.headers };
  }

  // Get instance
  getInstance(): AxiosInstance {
    return this.instance;
  }

  // Get config
  getConfig(): ApiConfig {
    return this.config;
  }

  // Get defaults
  getDefaults(): any {
    return this.instance.defaults;
  }

  // Reset interceptors
  resetInterceptors(): void {
    this.requestInterceptors.forEach(id => this.instance.interceptors.request.eject(id));
    this.responseInterceptors.forEach(id => this.instance.interceptors.response.eject(id));
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.setupInterceptors();
  }

  // Destroy client
  destroy(): void {
    this.resetInterceptors();
    this.instance = null!;
  }
}

// Create default API client
export const apiClient = new ApiClient();

// Hook for API operations
export function useApi<T = any>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(async (
    requestFn: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await requestFn();
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
          success: true,
        });
        onSuccess?.(response.data as T);
      } else {
        const errorMessage = response.error?.message || 'Request failed';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      });
      onError?.(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for paginated data
export function usePaginatedApi<T = any>(
  requestFn: (page: number, limit: number) => Promise<ApiResponse<T[]>>,
  initialPage: number = 1,
  initialLimit: number = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (reset: boolean = false) => {
    if (loading) return;

    const currentPage = reset ? initialPage : page;
    setLoading(true);
    setError(null);

    try {
      const response = await requestFn(currentPage, initialLimit);
      
      if (response.success) {
        const newData = response.data || [];
        const totalItems = response.meta?.total || 0;
        
        if (reset) {
          setData(newData);
        } else {
          setData(prev => [...prev, ...newData]);
        }
        
        setTotal(totalItems);
        setHasMore(newData.length === initialLimit);
        setPage(currentPage + 1);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [requestFn, page, initialLimit, loading, initialPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setTotal(0);
    setError(null);
  }, [initialPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch(false);
    }
  }, [loading, hasMore, fetch]);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    total,
    fetch,
    reset,
    loadMore,
  };
}

// Hook for infinite scroll
export function useInfiniteScroll<T = any>(
  requestFn: (page: number) => Promise<ApiResponse<T[]>>,
  options: {
    threshold?: number;
    rootMargin?: string;
    initialPage?: number;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '0px', initialPage = 1 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, { threshold, rootMargin });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, threshold, rootMargin]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await requestFn(page);
      
      if (response.success) {
        const newData = response.data || [];
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
        setHasMore(newData.length > 0);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [requestFn, page, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return {
    data,
    loading,
    error,
    hasMore,
    lastElementRef,
    loadMore,
    reset,
  };
}

// React hook imports
import { useState, useCallback, useRef } from 'react';