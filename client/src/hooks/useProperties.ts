import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { BRAND } from '../config/brand';

export interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  images: string[];
  rating: number;
}

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiClient.get('/api/properties', {
          params: {
            limit: 12,
            page: 1
          }
        });

        if (response.success && response.data) {
          const formattedProperties = response.data.map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            location: prop.location,
            price: prop.price_per_night ? `₹${prop.price_per_night}` : 'Price not available',
            priceValue: prop.price_per_night || 0,
            images: prop.images || [],
            imageUrl: prop.images?.[0] || BRAND.defaultPropertyImage,
            rating: prop.rating || 0
          }));

          setProperties(formattedProperties);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch properties');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return { properties, loading, error };
};
