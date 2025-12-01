import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import { showToast } from '../lib/toast';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  user_metadata?: {
    image_id?: string;
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const refreshInProgress = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Set the token in the API client
          apiClient.setAuthToken(token);
          await refreshUser();
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        showToast.error('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = async () => {
    // Prevent infinite retries with cooldown mechanism
    const now = Date.now();
    if (refreshInProgress.current || (now - lastRefreshTime < 2000)) {
      console.log('🔄 [Auth] Refresh already in progress or too soon, skipping');
      return;
    }

    refreshInProgress.current = true;
    setLastRefreshTime(now);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ [Auth] No access token found in localStorage');
        throw new Error('No access token found');
      }

      console.log('🔍 [Auth] Token found (first 20 chars):', token.substring(0, 20) + '...');

      // Set the token in the API client
      apiClient.setAuthToken(token);

      console.log('🔍 [Auth] Making request to /auth/me');

      // Get user profile from the server
      const response = await apiClient.get('/auth/me');

      console.log('🔍 [Auth] /auth/me response:', {
        success: response.success,
        hasData: !!response.data,
        hasUser: !!response.data?.user,
        userKeys: response.data?.user ? Object.keys(response.data.user) : []
      });

      if (response.success && response.data?.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
        };
        console.log('✅ [Auth] User profile updated:', userData.email);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.error('❌ [Auth] Failed to get user profile:', response);
        throw new Error('Failed to get user profile');
      }
    } catch (error: any) {
      console.error('❌ [Auth] User refresh error:', error);
      console.error('🔍 [Auth] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });

      // Only clear auth if it's a 401 or auth-related error
      if (error.response?.status === 401 || error.code === 'AUTH_ERROR') {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete apiClient.getDefaults().headers.common['Authorization'];
      }
      // For other errors, don't clear auth, just let it be
    } finally {
      refreshInProgress.current = false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // DIAGNOSTIC: Log client-side environment
      console.log('🔍 [Client] Login Environment Check:');
      console.log('   - API Base URL:', apiClient.getConfig().baseURL);

      console.log('🔍 [Client] Login attempt:', { email });

      const response = await apiClient.post('/auth/login', { email, password });

      console.log('🔍 [Client] Login response:', {
        hasData: !!response.data,
        success: response.success,
        hasError: !!response.error,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;

        console.log('✅ [Client] Login successful, storing tokens');

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Set the token in the API client
        apiClient.setAuthToken(accessToken);

        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };

        setUser(userData);
        setIsAuthenticated(true);
        showToast.success('Successfully logged in!');
      } else {
        console.error('❌ [Client] Login failed - server response:', response.data);
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ [Client] Login error:', error);
      console.error('🔍 [Client] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      showToast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      console.log('🔍 [Client] Signup attempt:', { email, name });

      const response = await apiClient.post('/auth/signup', {
        email,
        password,
        name,
        role: 'TENANT' // Default role
      });

      console.log('🔍 [Client] Signup response:', {
        hasData: !!response.data,
        success: response.success,
        hasError: !!response.error,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;

        console.log('✅ [Client] Signup successful, storing tokens');

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Set the token in the API client
        apiClient.setAuthToken(accessToken);

        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };

        setUser(userData);
        setIsAuthenticated(true);
        showToast.success('Account created successfully!');
      } else {
        console.error('❌ [Client] Signup failed - server response:', response.data);
        throw new Error(response.data.error?.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error('❌ [Client] Signup error:', error);
      console.error('🔍 [Client] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      showToast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      apiClient.clearAuthToken();

      setUser(null);
      setIsAuthenticated(false);
      showToast.success('Successfully logged out!');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export default AuthProvider;