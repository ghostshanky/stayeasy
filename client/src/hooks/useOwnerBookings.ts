import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface OwnerBooking {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  property: {
    name: string;
    address: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export function useOwnerBookings(limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchBookings = async () => {
      try {
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        const userId = session.user.id;

        // Fetch bookings for properties owned by the current user
        let query = (supabase as any)
          .from("bookings")
          .select(`
            id,
            user_id,
            property_id,
            check_in,
            check_out,
            guests,
            total_price,
            status,
            created_at,
            updated_at,
            property:properties(name, address),
            user:users(name, email)
          `)
          .eq('property.owner_id', userId)
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setItems(data || []);
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner bookings:", err);
          setError("Failed to fetch bookings");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      mounted = false;
    };
  }, [limit, page, status]);

  return { items, loading, error };
}