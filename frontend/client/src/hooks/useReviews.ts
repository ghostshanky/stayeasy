import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface Review {
  id: string;
  user_id: string;
  property_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    name: string;
  };
}

export function useReviews(propertyId?: string, limit = 12, page = 1) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchReviews = async () => {
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });
        
        if (propertyId) {
          params.append('property_id', propertyId);
        }

        const response = await apiClient.get(`/reviews?${params}`);
          
        if (!mounted) return;
        
        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          console.error('Failed to fetch reviews:', response.data.error);
        }
      } catch (error) {
        if (mounted) {
          console.error(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchReviews();
    
    return () => { mounted = false; };
  }, [propertyId, limit, page]);

  return { items, loading };
}