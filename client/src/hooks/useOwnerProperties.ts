import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { useAuth } from "./useAuth";

interface OwnerProperty {
  id: string;
  name: string;
  title: string; // Add title as it's often used
  location: string; // Add location
  address: string;
  price: number;
  price_per_night: number; // Add price_per_night
  available: boolean;
  description?: string;
  images: string[]; // Add images array
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
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchProperties = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Correct endpoint is /owner/properties, mounted at /api/owner/properties
        // But apiClient adds /api, so we need /owner/properties
        const response = await apiClient.get('/owner/properties', {
          params: {
            limit,
            page,
            ownerId: user.id
          }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          // Map the response data to match OwnerProperty interface if needed
          // The API returns properties with title, location, price_per_night, images
          // We need to map them to name, address, price, files for compatibility
          const mappedItems = response.data.map((p: any) => ({
            ...p,
            name: p.title,
            address: p.location,
            price: p.price_per_night,
            files: (p.images || []).map((url: string) => ({ url }))
          }));
          setItems(mappedItems);
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
  }, [limit, page, user]);

  return { items, loading, error };
}