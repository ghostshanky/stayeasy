import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

interface OwnerStats {
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
}

export const useOwnerStats = () => {
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/bookings/owner/stats');
                if (response.success) {
                    setStats(response.data);
                } else {
                    setError(response.error?.message || 'Failed to fetch stats');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
};
