import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface Property {
  id: string;
  name: string;
  location: string;
  price: string;
  priceValue: number;
  images?: string[];
  rating?: number;
}

export function useProperties(limit = 12, page = 1) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchProperties = async () => {
      try {
        console.log('🔍 [useProperties] Fetching properties from API...');
        const response = await apiClient.get(`/properties?limit=${limit}&page=${page}`);

        if (!mounted) return;

        console.log('🔍 [useProperties] API Response:', response);

        if (response.success && response.data) {
          // Transform the data to match the expected Property interface
          const transformedProperties = response.data.map((prop: any) => ({
            id: prop.id,
            name: prop.title || prop.name || 'Unnamed Property',
            location: prop.location || prop.address || 'Unknown Location',
            price: prop.price_per_night ? `₹${prop.price_per_night}` : 'Price not available',
            priceValue: prop.price_per_night || 0,
            images: prop.images || [],
            rating: prop.rating || 0
          }));

          setItems(transformedProperties);
          console.log('✅ [useProperties] Properties loaded:', transformedProperties.length);
        } else {
          console.error('❌ [useProperties] Failed to fetch properties:', response);
          setError(response.error?.message || 'Failed to fetch properties');
          setItems([]);
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [useProperties] Error fetching properties:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => { mounted = false; };
  }, [limit, page]);

  return { items, loading, error };
}
