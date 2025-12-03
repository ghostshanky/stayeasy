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

        const response = await apiClient.get(`/tenant/bookings?${params.toString()}`);

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response (camelCase) to Booking type (snake_case)
          const mappedBookings = response.data.map((b: any) => ({
            id: b.id,
            tenant_id: b.userId,
            owner_id: b.property?.ownerId, // Assuming property is included
            property_id: b.propertyId,
            check_in: b.checkIn,
            check_out: b.checkOut,
            status: b.status,
            total_amount: 0, // Calculate or get from API if available
            payment_status: 'PENDING' as PaymentStatus, // Default or get from API
            created_at: b.createdAt,
            updated_at: b.updatedAt,
            properties: b.property ? {
              id: b.property.id,
              title: b.property.title, // name -> title
              location: b.property.location,
              images: b.property.images || [],
              price: b.property.price
            } : undefined,
            // Map other fields as needed
          }));
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

        const response = await apiClient.get(`/owner/bookings?${params.toString()}`);

        if (!mounted) return;

        if (response.success && response.data) {
          // Map API response (camelCase) to Booking type (snake_case)
          const mappedBookings = response.data.map((b: any) => ({
            id: b.id,
            tenant_id: b.userId,
            owner_id: ownerId,
            property_id: b.propertyId,
            check_in: b.checkIn,
            check_out: b.checkOut,
            status: b.status,
            total_amount: 0, // TODO: Get from API
            payment_status: 'PENDING' as PaymentStatus, // TODO: Get from API
            created_at: b.createdAt,
            updated_at: b.updatedAt,
            properties: b.property ? {
              id: b.property.id,
              title: b.property.title,
              location: b.property.location,
              images: [], // TODO: Get images
              price: 0 // TODO: Get price
            } : undefined,
            tenant: b.user ? {
              id: b.user.id,
              name: b.user.name,
              email: b.user.email
            } : undefined
          }));
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