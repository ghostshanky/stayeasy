import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        const userId = session.user.id;

        // Fetch user profile
        const { data, error } = await (supabase as any)
          .from("users")
          .select(`
            id,
            email,
            name,
            phone,
            avatar_url,
            upi_id,
            created_at,
            updated_at
          `)
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setProfile(data || null);
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