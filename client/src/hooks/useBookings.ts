import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  total_amount: number;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    title: string;
    location: string;
    price_per_night: number;
    images: string[];
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function useBookings(userId: string, limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });
        
        if (status) {
          params.append('status', status);
        }

        const response = await apiClient.get(`/tenant/bookings?${params}`);

        if (!mounted) return;

        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          setError(response.data.error?.message || 'Failed to fetch bookings');
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching bookings:", err);
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
  }, [userId, limit, page, status]);

  return { items, loading, error };
}

export function useOwnerBookings(ownerId: string, limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });
        
        if (status) {
          params.append('status', status);
        }

        const response = await apiClient.get(`/owner/bookings?${params}`);

        if (!mounted) return;

        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          setError(response.data.error?.message || 'Failed to fetch bookings');
        }
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
  }, [ownerId, limit, page, status]);

  return { items, loading, error };
}