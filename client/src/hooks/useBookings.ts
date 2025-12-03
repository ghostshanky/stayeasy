import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { BRAND } from "../config/brand";
import { Booking, PaymentStatus } from "../types";

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
          page: page.toString(),
        });

        if (status) {
          params.append('status', status);
        }

        console.log('🔍 [useBookings] Fetching bookings for user:', userId);
        console.log('🔍 [useBookings] API URL:', `/bookings/tenant/bookings?${params.toString()}`);

        const response = await apiClient.get(`/api/bookings/tenant/bookings?${params.toString()}`);

        console.log('🔍 [useBookings] API Response:', {
          success: response.success,
          dataLength: response.data?.length,
          error: response.error
        });

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response to frontend Booking interface
          const mappedBookings = response.data.map((b: any) => ({
            id: b.id,
            tenant_id: b.userId,
            owner_id: b.property?.owner?.id,
            property_id: b.propertyId,
            check_in: b.checkIn,
            check_out: b.checkOut,
            status: b.status,
            total_amount: b.payments && b.payments.length > 0 ? b.payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) : 0,
            payment_status: b.payments && b.payments.length > 0 ? b.payments[0].status : 'PENDING' as PaymentStatus,
            created_at: b.createdAt,
            updated_at: b.updatedAt,
            properties: b.property ? {
              id: b.property.id,
              title: b.property.title,
              location: b.property.location,
              images: b.property.images || [],
              price: b.property.pricePerNight || b.property.price || 0
            } : undefined,
            tenant: b.user ? {
              id: b.user.id,
              name: b.user.name,
              email: b.user.email
            } : undefined
          }));
          console.log('🔍 [useBookings] Mapped bookings:', mappedBookings.length);
          setItems(mappedBookings);
        } else {
          console.error('❌ [useBookings] Failed to fetch bookings:', response.error);
          setError(response.error?.message || 'Failed to fetch bookings');
          setItems([]);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Error fetching bookings:", err);
          setError("Failed to fetch bookings");
          setItems([]);
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
          page: page.toString(),
        });

        if (status) {
          params.append('status', status);
        }

        console.log('🔍 [useOwnerBookings] Fetching bookings for owner:', ownerId);
        console.log('🔍 [useOwnerBookings] API URL:', `/bookings/owner/bookings?${params.toString()}`);

        const response = await apiClient.get(`/api/bookings/owner/bookings?${params.toString()}`);

        console.log('🔍 [useOwnerBookings] API Response:', {
          success: response.success,
          dataLength: response.data?.length,
          error: response.error
        });

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response to frontend Booking interface
          const mappedBookings = response.data.map((b: any) => ({
            id: b.id,
            tenant_id: b.userId,
            owner_id: ownerId,
            property_id: b.propertyId,
            check_in: b.checkIn,
            check_out: b.checkOut,
            status: b.status,
            total_amount: b.payments && b.payments.length > 0 ? b.payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) : 0,
            payment_status: b.payments && b.payments.length > 0 ? b.payments[0].status : 'PENDING' as PaymentStatus,
            created_at: b.createdAt,
            updated_at: b.updatedAt,
            properties: b.property ? {
              id: b.property.id,
              title: b.property.title,
              location: b.property.location,
              images: b.property.images || [],
              price: b.property.pricePerNight || b.property.price || 0
            } : undefined,
            tenant: b.user ? {
              id: b.user.id,
              name: b.user.name,
              email: b.user.email
            } : undefined
          }));
          console.log('🔍 [useOwnerBookings] Mapped bookings:', mappedBookings.length);
          setItems(mappedBookings);
        } else {
          // Fallback to sample data if API fails or returns empty (for dev)
          // But actually we should trust the API.
          // If error, show error.
          if (response.error) {
            console.error('❌ [useOwnerBookings] Failed to fetch bookings:', response.error);
            setError(response.error.message);
          }
          setItems([]);
        }

      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner bookings:", err);
          setError("Failed to fetch bookings");

          // Sample data for fallback/dev
          const sampleBookings: Booking[] = [
            {
              id: crypto.randomUUID(),
              tenant_id: crypto.randomUUID(),
              owner_id: ownerId,
              property_id: crypto.randomUUID(),
              check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              check_out: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'CONFIRMED',
              payment_status: 'COMPLETED',
              total_amount: 105000,
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              properties: {
                id: crypto.randomUUID(),
                title: 'Modern PG near Tech Park',
                location: 'Bangalore, Karnataka',
                images: [BRAND.defaultPropertyImage],
                price: 15000
              },
              tenant: {
                id: crypto.randomUUID(),
                name: 'Jane Smith',
                email: 'jane@example.com'
              }
            }
          ];
          console.log('🔍 [useOwnerBookings] Using sample data:', sampleBookings.length);
          setItems(sampleBookings);
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