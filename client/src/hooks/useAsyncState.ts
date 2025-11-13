import { useState, useCallback, useEffect, useRef, createContext, useContext, createElement } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
}

export interface AsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  onSuccessEffect?: (data: T) => void;
  onErrorEffect?: (error: Error) => void;
}

export function useAsyncState<T>(
  asyncFunction: () => Promise<T>,
  options: AsyncOptions<T> = {}
): {
  state: AsyncState<T>;
  execute: () => Promise<void>;
  reset: () => void;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
  setError: (error: Error) => void;
  setLoading: (loading: boolean) => void;
} {
  const {
    immediate = true,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
    onSuccessEffect,
    onErrorEffect,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          data,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        }));
        
        onSuccess?.(data);
        onSuccessEffect?.(data);
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      const apiError = error as Error;
      
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => execute(), retryDelay);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError,
        lastUpdated: Date.now(),
      }));
      
      onError?.(apiError);
      onErrorEffect?.(apiError);
    }
  }, [asyncFunction, onSuccess, onError, retryCount, retryDelay, onSuccessEffect, onErrorEffect]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
    retryCountRef.current = 0;
  }, []);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return execute();
  }, [execute]);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      lastUpdated: Date.now(),
    }));
  }, []);

  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      lastUpdated: Date.now(),
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
      lastUpdated: Date.now(),
    }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    state,
    execute,
    reset,
    refetch,
    setData,
    setError,
    setLoading,
  };
}

// Hook for paginated data
export function usePaginatedData<T>(
  fetchFunction: (page: number, limit: number) => Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>,
  initialLimit = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, initialLimit);
      
      setData(prev => [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, initialLimit, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setTotal(0);
    setError(null);
  }, []);

  const refetch = useCallback(() => {
    reset();
    loadMore();
  }, [reset, loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    reset,
    refetch,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T, P extends any[]>(
  mutationFunction: (...params: P) => Promise<T>,
  options: AsyncOptions<T> = {}
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const { state, execute, setData, setError, setLoading } = useAsyncState(
    async () => {
      if (!optimisticData) throw new Error('No optimistic data provided');
      return optimisticData;
    },
    {
      ...options,
      immediate: false,
    }
  );

  const mutate = useCallback(
    async (...params: P) => {
      try {
        // Set optimistic state
        const optimisticResult = await mutationFunction(...params);
        setOptimisticData(optimisticResult);
        setIsOptimistic(true);
        
        // Execute the actual mutation
        await execute();
        
        return optimisticResult;
      } catch (error) {
        // Revert optimistic state on error
        setOptimisticData(null);
        setIsOptimistic(false);
        throw error;
      }
    },
    [mutationFunction, execute]
  );

  const rollback = useCallback(() => {
    setOptimisticData(null);
    setIsOptimistic(false);
    setData(null as any);
    setError(new Error('Operation cancelled'));
    setLoading(false);
  }, [setData, setError, setLoading]);

  return {
    ...state,
    mutate,
    rollback,
    isOptimistic,
    optimisticData,
  };
}

// Hook for debounced state updates
export function useDebouncedState<T>(initialValue: T, delay: number): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, value, setValue];
}

// Hook for form state management
export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setTouchedField = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const validateField = useCallback((name: keyof T, value: any) => {
    if (!validationSchema || !validationSchema[name]) return null;
    
    const validator = validationSchema[name];
    return validator ? validator(value) : null;
  }, [validationSchema]);

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(values).forEach(key => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);
      
      if (validateForm()) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
      
      setIsSubmitting(false);
    },
    [values, validateForm]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((name: keyof T) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(name, e.target.value),
    onBlur: () => setTouchedField(name),
    error: errors[name],
    touched: touched[name],
  }), [values, errors, touched, setValue, setTouchedField]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setError,
    setTouchedField,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
  };
}

// Hook for local storage state
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;
  
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredState = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(state) : newValue;
      setState(valueToStore);
      window.localStorage.setItem(key, serialize(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, state]);

  const removeStoredState = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setState(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [state, setStoredState, removeStoredState] as const;
}

// Hook for global state management with context
export function createGlobalState<T>(initialState: T) {
  const Context = createContext<{
    state: T;
    setState: React.Dispatch<React.SetStateAction<T>>;
    reset: () => void;
  } | null>(null);

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<T>(initialState);

    const reset = useCallback(() => {
      setState(initialState);
    }, [initialState]);

    return createElement(Context.Provider, { value: { state, setState, reset } }, children);
  };

  const useGlobalState = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
  };

  return { Provider, useGlobalState };
}