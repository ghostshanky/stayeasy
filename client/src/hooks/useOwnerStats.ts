import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useOwnerProperties } from './useOwnerProperties';
import { useOwnerBookings } from './useBookings';

interface OwnerStats {
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
}

export const useOwnerStats = (ownerId?: string) => {
    const { items: properties, loading: propertiesLoading } = useOwnerProperties();
    const { items: bookings, loading: bookingsLoading } = useOwnerBookings(ownerId || '');
    
    const [stats, setStats] = useState<OwnerStats>({
        totalProperties: 0,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const calculateStats = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 [useOwnerStats] Calculating stats for owner:', ownerId);
                console.log('🔍 [useOwnerStats] Properties:', properties.length);
                console.log('🔍 [useOwnerStats] Bookings:', bookings.length);

                // Calculate stats from actual data
                const totalProperties = properties.length;
                
                // Filter bookings for this owner - bookings are already filtered by owner in the hook
                const ownerBookings = bookings;
                
                console.log('🔍 [useOwnerStats] Owner bookings:', ownerBookings.length);
                
                const totalBookings = ownerBookings.length;
                
                // Calculate total revenue from completed payments
                const totalRevenue = ownerBookings
                    .filter(booking => booking.status === 'COMPLETED')
                    .reduce((sum, booking) => {
                        const price = booking.properties?.price || 0;
                        const days = Math.ceil(
                            (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return sum + (price * days);
                    }, 0);

                // Calculate average rating (placeholder logic)
                const averageRating = 4.2; // This would need to be calculated from actual reviews

                console.log('🔍 [useOwnerStats] Final stats:', {
                    totalProperties,
                    totalBookings,
                    totalRevenue,
                    averageRating
                });

                setStats({
                    totalProperties,
                    totalBookings,
                    totalRevenue,
                    averageRating
                });

            } catch (err: any) {
                setError(err.message || 'An error occurred while calculating stats');
                console.error('Stats calculation error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (!propertiesLoading && !bookingsLoading && ownerId) {
            calculateStats();
        }
    }, [properties, bookings, propertiesLoading, bookingsLoading, ownerId]);

    return { stats, loading, error };
};
