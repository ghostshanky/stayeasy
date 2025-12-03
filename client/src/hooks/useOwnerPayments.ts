import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/apiClient";

interface OwnerPayment {
  id: string;
  booking_id: string;
  user_id: string;
  owner_id: string;
  amount: number;
  currency: string;
  status: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';
  upi_uri?: string;
  upi_reference?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  booking: {
    check_in: string;
    check_out: string;
    property: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

export function useOwnerPayments(ownerId: string, limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchPayments = async () => {
      try {
        const response = await apiClient.get('/payments/owner', {
          params: { limit, page, status }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
        } else {
          console.error('❌ [useOwnerPayments] Failed to fetch payments:', response.error);
          setError(response.error?.message || 'Failed to fetch payments');
          setItems([]);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner payments:", err);
          setError("Failed to fetch payments");
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      mounted = false;
    };
  }, [ownerId, limit, page, status]);

  return { items, loading, error };
}