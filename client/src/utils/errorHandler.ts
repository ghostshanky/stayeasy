import React, { ComponentType, ErrorInfo, ReactNode, useState, useEffect, useCallback } from 'react';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Error interface
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
}

// Error handler interface
export interface ErrorHandler {
  canHandle: (error: any) => boolean;
  handle: (error: any, context?: Record<string, any>) => AppError;
}

// Default error handler
const defaultErrorHandler: ErrorHandler = {
  canHandle: (error: any) => true,
  handle: (error: any, context?: Record<string, any>): AppError => {
    return {
      id: generateErrorId(),
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error?.message || 'An unknown error occurred',
      details: error?.toString(),
      timestamp: new Date(),
      stack: error?.stack,
      context,
    };
  },
};

// Network error handler
const networkErrorHandler: ErrorHandler = {
  canHandle: (error: any) => {
    return (
      error?.response?.status ||
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('fetch')
    );
  },
  handle: (error: any, context?: Record<string, any>): AppError => {
    const status = error?.response?.status;
    let message = 'Network error occurred';
    
    if (status === 0) {
      message = 'No internet connection';
    } else if (status >= 500) {
      message = 'Server error occurred';
    } else if (status === 404) {
      message = 'Resource not found';
    } else if (status === 401) {
      message = 'Authentication required';
    } else if (status === 403) {
      message = 'Access denied';
    }

    return {
      id: generateErrorId(),
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      message,
      details: error?.response?.data?.message || error?.message,
      timestamp: new Date(),
      stack: error?.stack,
      context: {
        status,
        ...context,
      },
    };
  },
};

// Authentication error handler
const authErrorHandler: ErrorHandler = {
  canHandle: (error: any) => {
    return (
      error?.response?.status === 401 ||
      error?.response?.status === 403 ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('forbidden') ||
      error?.code === 'UNAUTHENTICATED'
    );
  },
  handle: (error: any, context?: Record<string, any>): AppError => {
    return {
      id: generateErrorId(),
      type: ErrorType.AUTH,
      severity: ErrorSeverity.HIGH,
      message: 'Authentication failed',
      details: error?.response?.data?.message || error?.message,
      timestamp: new Date(),
      stack: error?.stack,
      context,
    };
  },
};

// Validation error handler
const validationErrorHandler: ErrorHandler = {
  canHandle: (error: any) => {
    return (
      error?.response?.status === 400 ||
      error?.message?.includes('validation') ||
      error?.message?.includes('invalid') ||
      error?.code === 'VALIDATION_ERROR'
    );
  },
  handle: (error: any, context?: Record<string, any>): AppError => {
    const details = error?.response?.data?.errors || error?.response?.data?.message;
    return {
      id: generateErrorId(),
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: 'Validation error',
      details: typeof details === 'string' ? details : JSON.stringify(details),
      timestamp: new Date(),
      stack: error?.stack,
      context,
    };
  },
};

// Error handler registry
export class ErrorHandlerRegistry {
  private handlers: ErrorHandler[] = [
    networkErrorHandler,
    authErrorHandler,
    validationErrorHandler,
    defaultErrorHandler,
  ];

  register(handler: ErrorHandler): void {
    this.handlers.unshift(handler);
  }

  unregister(handler: ErrorHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  handle(error: any, context?: Record<string, any>): AppError {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        return handler.handle(error, context);
      }
    }
    return defaultErrorHandler.handle(error, context);
  }
}

// Global error handler registry
export const errorRegistry = new ErrorHandlerRegistry();

// Generate unique error ID
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError) => ReactNode;
  onError?: (error: AppError) => void;
  onErrorLog?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = errorRegistry.handle(error);
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = errorRegistry.handle(error, {
      componentStack: errorInfo.componentStack,
    });

    if (this.props.onError) {
      this.props.onError(appError);
    }

    if (this.props.onErrorLog !== false) {
      console.error('ErrorBoundary caught an error:', appError);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }

      return React.createElement('div', { className: 'p-6 text-center' },
        React.createElement('div', { className: 'text-error mb-4' },
          React.createElement('svg', {
            className: 'w-16 h-16 mx-auto',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            })
          )
        ),
        React.createElement('h2', { className: 'text-xl font-semibold text-gray-900 mb-2' },
          'Something went wrong'
        ),
        React.createElement('p', { className: 'text-gray-600 mb-4' },
          this.state.error?.message || 'An unexpected error occurred'
        ),
        React.createElement('button', {
          onClick: () => this.setState({ hasError: false }),
          className: 'px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors'
        }, 'Try again')
      );
    }

    return this.props.children;
  }
}

// Error logging service
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: AppError[] = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: AppError): void {
    this.logs.push(error);
    
    // Keep only last 1000 errors
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Send to error tracking service if available
    this.sendToErrorTracking(error);
  }

  getLogs(): AppError[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private sendToErrorTracking(error: AppError): void {
    // In a real application, this would send to services like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }
}

// Global error logger
export const errorLogger = ErrorLogger.getInstance();

// Error handling hook
export function useErrorHandler() {
  const handleError = useCallback((error: any, context?: Record<string, any>) => {
    const appError = errorRegistry.handle(error, context);
    errorLogger.log(appError);
    return appError;
  }, []);

  const handleAsyncError = useCallback(async (promise: Promise<any>, context?: Record<string, any>) => {
    try {
      return await promise;
    } catch (error) {
      const appError = errorRegistry.handle(error, context);
      errorLogger.log(appError);
      throw appError;
    }
  }, []);

  return { handleError, handleAsyncError };
}

// Retry utility
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: any, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (onRetry) {
        onRetry(error, attempt);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
}

// Error tracking hook
export function useErrorTracking() {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const appError = errorRegistry.handle(event.error, {
        source: 'window',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      
      errorLogger.log(appError);
      setErrors(prev => [...prev, appError]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const appError = errorRegistry.handle(event.reason, {
        source: 'unhandledrejection',
      });
      
      errorLogger.log(appError);
      setErrors(prev => [...prev, appError]);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return { errors, clearErrors };
}

// Export all utilities
export {
  defaultErrorHandler,
  networkErrorHandler,
  authErrorHandler,
  validationErrorHandler,
  // Export the main error handler instance
  defaultErrorHandler as errorHandler,
};

// Export types
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
};