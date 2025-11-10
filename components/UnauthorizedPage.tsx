import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function UnauthorizedPage() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
              block
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              What happened?
            </h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              {location.state?.from 
                ? `You tried to access ${location.state.from.pathname} but don't have the required permissions.`
                : 'You attempted to access a page that requires different user permissions.'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Go to Home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Login with Different Account
            </Link>
          </div>

          {location.state?.from && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tried to access:</strong> {location.state.from.pathname}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Required role:</strong> {location.state?.requiredRole || 'Authenticated user'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}