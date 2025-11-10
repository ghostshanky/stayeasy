import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface OwnerProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  upi_id?: string;
  created_at: string;
  updated_at: string;
}

export function useOwnerProfile() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        // Get the current user ID from localStorage (where the auth token is stored)
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authenticated user");
        }

        // For now, we'll need to get the user ID from the token or another source
        // This is a simplified approach - in a real app, you'd decode the JWT or have an endpoint to get current user
        const response = await apiClient.get('/users/me');

        if (!mounted) return;

        if (response.data.success) {
          setProfile(response.data.data || null);
        } else {
          console.error("Error fetching owner profile:", response.data.error);
          setError(response.data.error?.message || "Failed to fetch profile");
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner profile:", err);
          setError("Failed to fetch profile");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading, error };
}