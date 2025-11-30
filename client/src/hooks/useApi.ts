import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse } from '../config/api';
import { ApiError } from '../config/api';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (response.success && response.data) {
        setState(prev => ({ ...prev, data: response.data || null, loading: false }));
        onSuccess?.(response.data);
      } else {
        throw new ApiError(response.error?.message || 'Request failed');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({ ...prev, error: apiError, loading: false }));
      onError?.(apiError);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

// Generic hook for API data fetching
export function useApiData<T>(
  endpoint: string,
  params?: Record<string, any>,
  options: UseApiOptions = {}
) {
  return useApi<T>(
    async () => {
      const response = await apiClient.get<T>(endpoint, { params });
      return response;
    },
    options
  );
}

// Hook for form submission
export function useApiSubmit<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: UseApiOptions = {}
) {
  return useApi<T>(
    async () => {
      const response = await apiClient[method.toLowerCase() as 'post' | 'put' | 'delete']<T>(
        endpoint,
        (options as any).data
      );
      return response;
    },
    options
  );
}