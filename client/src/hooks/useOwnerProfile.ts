import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { BRAND } from '../config/brand';

export interface OwnerProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar_url: string;
  upi_id: string;
  created_at: string;
  updated_at: string;
}

export const useOwnerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // In a real app, we would fetch this from the API
        // const response = await apiClient.get('/owner/profile');
        // setProfile(response.data);

        // For now, we'll simulate a fetch with user data
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || 'owner@example.com',
            name: user.name || 'Owner Name',
            phone: '+91 98765 43210',
            avatar_url: BRAND.defaultAvatar,
            upi_id: 'owner@upi',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        } else {
          // Fallback for demo/testing if no user is logged in (should be handled by auth guard)
          setProfile({
            id: 'owner-123',
            email: 'owner@example.com',
            name: 'John Owner',
            phone: '+91 98765 43210',
            avatar_url: BRAND.defaultAvatar,
            upi_id: 'owner@upi',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching owner profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<OwnerProfile>) => {
    try {
      setLoading(true);
      // await apiClient.put('/owner/profile', updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateProfile };
};