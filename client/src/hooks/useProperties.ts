import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  images: string[];
  rating?: number;
}

export function useProperties(limit = 12, page = 1) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchProperties = async () => {
      try {
        const response = await apiClient.get(`/properties?limit=${limit}&offset=${(page - 1) * limit}`);
        
        if (!mounted) return;
        
        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          console.error('Failed to fetch properties:', response.data.error);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching properties:', error);
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

  return { items, loading };
}