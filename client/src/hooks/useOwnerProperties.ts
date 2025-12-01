import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/apiClient";

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
        const response = await apiClient.get('/properties/owner', {
          params: { limit, page }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
        } else {
          console.error('❌ [useOwnerProperties] Failed to fetch properties:', response.error);
          setError(response.error?.message || 'Failed to fetch properties');
          setItems([]);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner properties:", err);
          setError("Failed to fetch properties");
          setItems([]);
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