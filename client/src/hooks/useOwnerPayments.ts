import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

export function useOwnerPayments(limit = 10, page = 1, status?: string) {
  const [items, setItems] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchPayments = async () => {
      try {
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        const userId = session.user.id;

        // Fetch payments for the current owner
        let query = (supabase as any)
          .from("payments")
          .select(`
            id,
            booking_id,
            user_id,
            owner_id,
            amount,
            currency,
            status,
            upi_reference,
            verified_by,
            verified_at,
            created_at,
            updated_at,
            booking:bookings(
              check_in,
              check_out,
              property:properties(name)
            ),
            user:users(name, email)
          `)
          .eq('owner_id', userId)
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setItems(data || []);
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
  }, [limit, page, status]);

  return { items, loading, error };
}