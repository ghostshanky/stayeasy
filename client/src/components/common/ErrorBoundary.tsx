import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorBoundary as ErrorBoundaryType, AppError } from '../../utils/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private unsubscribe?: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  componentDidMount(): void {
    this.unsubscribe = errorHandler.onError((error: AppError) => {
      this.setState({ hasError: true, error });
      this.props.onError?.(error);
    });
  }

  componentWillUnmount(): void {
    this.unsubscribe?.();
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    const appError = errorHandler.handleError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: AppError;
  retry: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry }) => {
  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return 'wifi_off';
      case 'AUTH_ERROR':
        return 'lock';
      case 'VALIDATION_ERROR':
        return 'error';
      case 'NOT_FOUND':
        return 'search_off';
      case 'PERMISSION_DENIED':
        return 'no_accounts';
      case 'SERVER_ERROR':
        return 'server';
      default:
        return 'error';
    }
  };

  const getErrorColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className={`mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4`}>
          <span className={`material-symbols-outlined text-2xl ${getErrorColor(error.severity)}`}>
            {getErrorIcon(error.type)}
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
          {errorHandler.getUserMessage(error)}
        </p>
        
        {error.details && (
          <details className="text-left mb-6">
            <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
              Error Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={retry}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for error boundary
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    errorHandler.handleError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, captureError, resetError };
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
    onError?: (error: AppError) => void;
  } = {}
) {
  return function ErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Error display component for inline errors
interface ErrorDisplayProps {
  error: string | Error | null | undefined;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, className = '' }) => {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`text-red-600 dark:text-red-400 text-sm ${className}`}>
      <span className="material-symbols-outlined text-xs mr-1">error</span>
      {errorMessage}
    </div>
  );
};

// Success display component
interface SuccessDisplayProps {
  message: string;
  className?: string;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ message, className = '' }) => {
  return (
    <div className={`text-green-600 dark:text-green-400 text-sm ${className}`}>
      <span className="material-symbols-outlined text-xs mr-1">check_circle</span>
      {message}
    </div>
  );
};

// Warning display component
interface WarningDisplayProps {
  message: string;
  className?: string;
}

export const WarningDisplay: React.FC<WarningDisplayProps> = ({ message, className = '' }) => {
  return (
    <div className={`text-yellow-600 dark:text-yellow-400 text-sm ${className}`}>
      <span className="material-symbols-outlined text-xs mr-1">warning</span>
      {message}
    </div>
  );
};

// Info display component
interface InfoDisplayProps {
  message: string;
  className?: string;
}

export const InfoDisplay: React.FC<InfoDisplayProps> = ({ message, className = '' }) => {
  return (
    <div className={`text-blue-600 dark:text-blue-400 text-sm ${className}`}>
      <span className="material-symbols-outlined text-xs mr-1">info</span>
      {message}
    </div>
  );
};