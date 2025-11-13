import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-primary',
  className = '',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-transparent ${sizeClasses[size]} ${color}`}
      >
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  className = '',
}) => {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

interface LoadingCardProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  isLoading,
  message = 'Loading...',
  className = '',
}) => {
  if (!isLoading) return null;

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-center">
        <LoadingSpinner size="md" />
        {message && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};