import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

interface OwnerPayment {
  id: string;
  booking_id: string;
  user_id: string;
  owner_id: string;
  amount: number;
  currency: string;
  status: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';
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
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });
        
        if (status) {
          params.append('status', status);
        }

        const response = await apiClient.get(`/payments/owner/${ownerId}?${params}`);

        if (!mounted) return;

        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          console.error("Error fetching owner payments:", response.data.error);
          setError(response.data.error?.message || "Failed to fetch payments");
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner payments:", err);
          setError("Failed to fetch payments");
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