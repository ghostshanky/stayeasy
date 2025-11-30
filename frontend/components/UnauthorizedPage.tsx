import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../client/src/api/apiClient';
import { showToast } from '../client/src/lib/toast';

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleBecomeHost = async () => {
    try {
      setIsChangingRole(true);
      
      // Get the current user's access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showToast.error('Please login first to become a host');
        navigate('/auth');
        return;
      }

      // Set the token in the API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Call the backend API to update user role to OWNER
      const response = await apiClient.patch('/auth/me/role', { role: 'OWNER' });

      if (response.data.success) {
        showToast.success('Congratulations! You are now a host. Redirecting to owner dashboard...');
        
        // Clear any existing tokens and redirect to owner dashboard
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete apiClient.defaults.headers.common['Authorization'];
        
        // Redirect to owner dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard/owner');
        }, 2000);
      } else {
        throw new Error(response.data.error?.message || 'Failed to update role');
      }
    } catch (error: any) {
      console.error('Error becoming host:', error);
      showToast.error(error.response?.data?.error?.message || 'Failed to become a host. Please try again.');
    } finally {
      setIsChangingRole(false);
    }
  };

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
            {location.state?.requiredRole === 'OWNER' && (
              <button
                onClick={handleBecomeHost}
                disabled={isChangingRole}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isChangingRole ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  'Become a Host'
                )}
              </button>
            )}
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