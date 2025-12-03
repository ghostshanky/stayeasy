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

        const response = await apiClient.get(`/api/payments?${params.toString()}`);

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response to frontend Payment interface
          const mappedPayments = response.data.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            user_id: p.user_id,
            owner_id: p.owner_id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            upi_uri: p.upi_uri,
            upi_reference: p.upi_reference,
            verified_by: p.verified_by,
            verified_at: p.verified_at,
            created_at: p.created_at,
            updated_at: p.updated_at,
            booking: p.booking ? {
              check_in: p.booking.check_in,
              check_out: p.booking.check_out,
              property: {
                name: p.booking.property.name,
                address: p.booking.property.address || p.booking.property.location
              }
            } : undefined,
            user: p.user ? {
              name: p.user.name,
              email: p.user.email
            } : undefined,
            invoice: p.invoice ? {
              id: p.invoice.id,
              invoice_no: p.invoice.invoice_no,
              amount: p.invoice.amount,
              status: p.invoice.status
            } : undefined
          }));
          setItems(mappedPayments);
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
        console.log('🔍 [useOwnerPayments] Fetching payments for owner:', ownerId);
        console.log('🔍 [useOwnerPayments] API URL:', '/payments/owner');
        console.log('🔍 [useOwnerPayments] API Params:', { limit, page, status });

        const response = await apiClient.get(`/api/payments/owner/${ownerId}`, {
          params: { limit, page, status }
        });

        console.log('🔍 [useOwnerPayments] API Response:', {
          success: response.success,
          dataLength: response.data?.length,
          error: response.error
        });

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response to frontend Payment interface
          const mappedPayments = response.data.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            user_id: p.user_id,
            owner_id: p.owner_id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            upi_uri: p.upi_uri,
            upi_reference: p.upi_reference,
            verified_by: p.verified_by,
            verified_at: p.verified_at,
            created_at: p.created_at,
            updated_at: p.updated_at,
            booking: p.booking ? {
              check_in: p.booking.check_in,
              check_out: p.booking.check_out,
              property: {
                name: p.booking.property.name,
                address: p.booking.property.address || p.booking.property.location
              }
            } : undefined,
            user: p.user ? {
              name: p.user.name,
              email: p.user.email
            } : undefined,
            invoice: p.invoice ? {
              id: p.invoice.id,
              invoice_no: p.invoice.invoice_no,
              amount: p.invoice.amount,
              status: p.invoice.status
            } : undefined
          }));
          setItems(mappedPayments);
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
        const response = await apiClient.get('/api/payments/pending');

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response to frontend Payment interface
          const mappedPayments = response.data.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            user_id: p.user_id,
            owner_id: p.owner_id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            upi_uri: p.upi_uri,
            upi_reference: p.upi_reference,
            verified_by: p.verified_by,
            verified_at: p.verified_at,
            created_at: p.created_at,
            updated_at: p.updated_at,
            booking: p.booking ? {
              check_in: p.booking.check_in,
              check_out: p.booking.check_out,
              property: {
                name: p.booking.property.name,
                address: p.booking.property.address || p.booking.property.location
              }
            } : undefined,
            user: p.user ? {
              name: p.user.name,
              email: p.user.email
            } : undefined,
            invoice: p.invoice ? {
              id: p.invoice.id,
              invoice_no: p.invoice.invoice_no,
              amount: p.invoice.amount,
              status: p.invoice.status
            } : undefined
          }));
          setItems(mappedPayments);
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

export function confirmPayment(paymentId: string, upiReference?: string) {
  return apiClient.post('/api/payments/confirm', {
    paymentId,
    upiReference
  });
}

export function verifyPayment(paymentId: string, verified: boolean, note?: string) {
  return apiClient.post('/api/payments/verify', {
    paymentId,
    verified,
    note
  });
}

export function createPayment(bookingId: string, amount?: number) {
  return apiClient.post('/api/payments', {
    bookingId,
    amount
  });
}
