import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiClient } from '../client/src/api/apiClient';
import { showToast } from '../client/src/lib/toast';
import UnauthorizedPage from './UnauthorizedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndAuthorization = async () => {
      try {
        // Check for access token in localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Set the token in the API client
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify user is authenticated by calling /auth/me endpoint
        const response = await apiClient.get('/auth/me');
        
        if (!response.data.success) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const userData: User = {
          id: response.data.data.user.id,
          email: response.data.data.user.email,
          name: response.data.data.user.name,
          role: response.data.data.user.role,
        };

        setUser(userData);
        setIsAuthenticated(true);

        // Check if user has required role
        if (requiredRoles.length === 0 || requiredRoles.includes(userData.role)) {
          setIsAuthorized(true);
        } else {
          // User is authenticated but doesn't have required role
          setIsAuthorized(false);
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        if (error.response?.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete apiClient.defaults.headers.common['Authorization'];
        }
        showToast.error('Authentication check failed. Please login again.');
        setIsAuthenticated(false);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndAuthorization();
  }, [requiredRoles, redirectTo]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authenticated but not authorized, redirect to unauthorized page
  if (!isAuthorized) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: requiredRoles.length > 0 ? requiredRoles[0] : 'Authenticated user'
        }}
        replace
      />
    );
  }

  // If authorized, render the children
  return <>{children}</>;
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requiredRoles?: string[]; redirectTo?: string } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}