import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../lib/toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user has required role
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    // User is authenticated but doesn't have required role
    showToast.error('You do not have permission to access this page.');
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