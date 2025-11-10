import { useEffect, useState } from "react";
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
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });

        const response = await apiClient.get(`/owner/properties?${params}`);

        if (!mounted) return;

        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          console.error("Error fetching owner properties:", response.data.error);
          setError(response.data.error?.message || "Failed to fetch properties");
        }
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