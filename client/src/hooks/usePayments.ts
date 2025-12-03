import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/apiClient";

interface Payment {
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
      address: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoice_no: string;
    amount: number;
    status: string;
  };
}

export function usePayments(userId: string, limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<Payment[]>([]);
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
          page: page.toString(),
        });

        if (status) {
          params.append('status', status);
        }

        const response = await apiClient.get(`/payments?${params.toString()}`);

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
        } else {
          console.error('❌ [usePayments] Failed to fetch payments:', response.error);
          setError(response.error?.message || 'Failed to fetch payments');
          setItems([]);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Error fetching payments:", err);
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
  }, [userId, limit, page, status]);

  return { items, loading, error };
}

export function useOwnerPayments(ownerId: string, limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<Payment[]>([]);
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

export function usePendingPayments(ownerId: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchPendingPayments = async () => {
      try {
        const response = await apiClient.get('/payments/owner', {
          params: { status: 'AWAITING_PAYMENT' }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
        } else {
          console.error('❌ [usePendingPayments] Failed to fetch pending payments:', response.error);
          setError(response.error?.message || 'Failed to fetch pending payments');
          setItems([]);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching pending payments:", err);
          setError("Failed to fetch pending payments");
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPendingPayments();

    return () => {
      mounted = false;
    };
  }, [ownerId]);

  return { items, loading, error };
}
