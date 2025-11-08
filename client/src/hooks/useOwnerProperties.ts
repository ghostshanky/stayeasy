import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Property } from "../../../types";

interface OwnerProperty {
  id: string;
  name: string;
  address: string;
  price: number;
  available: boolean;
  description?: string;
  files: {
    url: string;
  }[];
  bookings: {
    id: string;
    check_in: string;
    check_out: string;
    status: string;
  }[];
}

export function useOwnerProperties(limit = 10, page = 1) {
  const [items, setItems] = useState<OwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchProperties = async () => {
      try {
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        const userId = session.user.id;

        // Fetch properties owned by the current user
        const { data, error } = await (supabase as any)
          .from("properties")
          .select(`
            id,
            name,
            address,
            price,
            available,
            description,
            files!inner(url),
            bookings (
              id,
              check_in,
              check_out,
              status
            )
          `)
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setItems(data || []);
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner properties:", err);
          setError("Failed to fetch properties");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => {
      mounted = false;
    };
  }, [limit, page]);

  return { items, loading, error };
}