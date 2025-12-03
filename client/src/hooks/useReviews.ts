import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    full_name?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export function useReviews(propertyId: string | undefined, limit = 10, page = 1) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchReviews = async () => {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/api/reviews', {
          params: {
            propertyId,
            limit,
            page
          }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
          if (response.pagination) {
            setTotal(response.pagination.total);
          }
        } else {
          console.error('Error fetching reviews:', response.error);
          setError(response.error?.message || 'Failed to fetch reviews');
          setItems([]);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching reviews:", err);
          setError("Failed to fetch reviews");
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, [propertyId, limit, page]);

  return { items, loading, error, total };
}