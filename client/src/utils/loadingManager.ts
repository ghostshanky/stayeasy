import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// Loading state interface
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Loading context interface
interface LoadingContextType {
  loadingState: LoadingState;
  showLoading: (message?: string, progress?: number) => void;
  hideLoading: () => void;
  updateProgress: (progress: number) => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

// Loading context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Loading provider component
interface LoadingProviderProps {
  children: ReactNode;
  defaultLoading?: LoadingState;
}

const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children, 
  defaultLoading = { isLoading: false } 
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>(defaultLoading);

  const showLoading = useCallback((message?: string, progress?: number) => {
    setLoadingState({ 
      isLoading: true, 
      message, 
      progress 
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState({ isLoading: false });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({ 
      ...prev, 
      progress: Math.max(0, Math.min(100, progress)) 
    }));
  }, []);

  const withLoading = useCallback(async <T>(
    fn: () => Promise<T>, 
    message?: string
  ): Promise<T> => {
    showLoading(message);
    try {
      const result = await fn();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const value: LoadingContextType = {
    loadingState,
    showLoading,
    hideLoading,
    updateProgress,
    withLoading,
  };

  return React.createElement(LoadingContext.Provider, { value }, children);
};

// Hook to use loading context
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return React.createElement('div', { 
    className: `inline-block animate-spin ${sizeClasses[size]} ${className}` 
  },
    React.createElement('svg', { 
      className: 'w-full h-full', 
      viewBox: '0 0 24 24', 
      fill: 'none' 
    },
      React.createElement('circle', {
        className: 'opacity-25',
        cx: '12',
        cy: '12',
        r: '10',
        stroke: 'currentColor',
        strokeWidth: '4'
      }),
      React.createElement('path', {
        className: color,
        fill: 'currentColor',
        d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      })
    )
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  backdrop?: boolean;
  children: ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  backdrop = true,
  children,
}) => {
  if (!isLoading) {
    return React.createElement(React.Fragment, null, children);
  }

  const overlayContent = React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg' },
      React.createElement(LoadingSpinner, { size: 'lg', className: 'mb-4' }),
      message && React.createElement('p', { className: 'text-gray-700 dark:text-gray-300 text-center mb-2' }, message),
      progress !== undefined && React.createElement('div', { className: 'w-48 bg-gray-200 rounded-full h-2' },
        React.createElement('div', {
          className: 'bg-primary h-2 rounded-full transition-all duration-300',
          style: { width: `${progress}%` }
        })
      )
    )
  );

  return React.createElement('div', { className: 'relative' },
    children,
    backdrop && overlayContent
  );
};

// Button loading wrapper
interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = 'Loading...',
  disabled,
  children,
  className = '',
  onClick,
  type = 'button',
}) => {
  const isDisabled = disabled || isLoading;

  const buttonProps = {
    type,
    disabled: isDisabled,
    onClick,
    className: `relative ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`
  };

  const loadingSpinner = React.createElement('span', { 
    className: 'absolute inset-0 flex items-center justify-center' },
    React.createElement(LoadingSpinner, { size: 'sm' })
  );

  const childrenContent = React.createElement('span', { 
    className: isLoading ? 'invisible' : 'visible' 
  }, children);

  const loadingTextOverlay = isLoading && React.createElement('span', { 
    className: 'absolute inset-0 flex items-center justify-center text-white' 
  }, loadingText);

  return React.createElement('button', buttonProps,
    loadingSpinner,
    childrenContent,
    loadingTextOverlay
  );
};

// Page loading component
interface PageLoadingProps {
  message?: string;
  progress?: number;
}

const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  progress,
}) => {
  return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark' },
    React.createElement('div', { className: 'text-center' },
      React.createElement(LoadingSpinner, { size: 'lg', className: 'mb-4' }),
      React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mb-4' }, message),
      progress !== undefined && React.createElement('div', { className: 'w-64 bg-gray-200 rounded-full h-2 mx-auto' },
        React.createElement('div', {
          className: 'bg-primary h-2 rounded-full transition-all duration-300',
          style: { width: `${progress}%` }
        })
      )
    )
  );
};

// Async operation hook
export function useAsyncOperation<T = any>() {
  const { showLoading, hideLoading, withLoading } = useLoading();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const execute = useCallback(async (
    fn: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T> => {
    setStatus('loading');
    setError(null);
    
    try {
      const result = await withLoading(fn, loadingMessage);
      setData(result);
      setStatus('success');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
      throw err;
    }
  }, [withLoading]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
    showLoading,
    hideLoading,
  };
}

// Multiple loading states manager
export class LoadingManager {
  private static instance: LoadingManager;
  private loadingStates: Map<string, LoadingState> = new Map();

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  showLoading(key: string, message?: string, progress?: number): void {
    this.loadingStates.set(key, { 
      isLoading: true, 
      message, 
      progress 
    });
    this.notifyChange();
  }

  hideLoading(key: string): void {
    this.loadingStates.delete(key);
    this.notifyChange();
  }

  updateProgress(key: string, progress: number): void {
    const state = this.loadingStates.get(key);
    if (state) {
      this.loadingStates.set(key, { 
        ...state, 
        progress: Math.max(0, Math.min(100, progress)) 
      });
      this.notifyChange();
    }
  }

  isLoading(key?: string): boolean {
    if (key) {
      return this.loadingStates.has(key);
    }
    return this.loadingStates.size > 0;
  }

  getLoadingState(key?: string): LoadingState | undefined {
    if (key) {
      return this.loadingStates.get(key);
    }
    
    // Return combined state if multiple loadings
    if (this.loadingStates.size === 0) {
      return { isLoading: false };
    }

    const states = Array.from(this.loadingStates.values());
    const hasAnyLoading = states.some(state => state.isLoading);
    const messages = states
      .filter(state => state.message)
      .map(state => state.message)
      .filter(Boolean);
    
    return {
      isLoading: hasAnyLoading,
      message: messages.length > 0 ? messages.join(', ') : undefined,
      progress: states[0]?.progress,
    };
  }

  clearAll(): void {
    this.loadingStates.clear();
    this.notifyChange();
  }

  private notifyChange(): void {
    // In a real app, this could trigger a global state update
    console.log('Loading states updated:', this.getLoadingState());
  }
}

// Global loading manager instance
export const globalLoadingManager = LoadingManager.getInstance();

// Hook for multiple loading states
export function useGlobalLoading(key: string) {
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });

  useEffect(() => {
    const updateState = () => {
      setLoadingState(globalLoadingManager.getLoadingState(key) || { isLoading: false });
    };

    // Initial update
    updateState();

    // In a real app, you might want to subscribe to loading state changes
    // For now, we'll just update when the component mounts/unmounts
    return () => {
      // Cleanup subscription if needed
    };
  }, [key]);

  const showLoading = useCallback((message?: string, progress?: number) => {
    globalLoadingManager.showLoading(key, message, progress);
  }, [key]);

  const hideLoading = useCallback(() => {
    globalLoadingManager.hideLoading(key);
  }, [key]);

  const updateProgress = useCallback((progress: number) => {
    globalLoadingManager.updateProgress(key, progress);
  }, [key]);

  return {
    loadingState,
    showLoading,
    hideLoading,
    updateProgress,
    isLoading: loadingState.isLoading,
  };
}

// Export all components and utilities
export {
  LoadingProvider,
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  PageLoading,
};

// Export types
export type {
  LoadingContextType,
  LoadingProviderProps,
  LoadingSpinnerProps,
  LoadingOverlayProps,
  LoadingButtonProps,
  PageLoadingProps,
};