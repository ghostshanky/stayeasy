import React, { useState, useEffect } from 'react';
import { Page, Listing, StatCardData, StatChangeDirection, ListingStatus } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerStatCard from '../components/owner/OwnerStatCard';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';
import { useOwnerProperties } from '../client/src/hooks/useOwnerProperties';
import { supabase } from '../client/src/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../client/src/hooks/useAuth';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<StatCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'payments'
    const [payments, setPayments] = useState<any[]>([]);
    const { items: properties, loading: listingsLoading } = useOwnerProperties();

    // Transform properties to listings format
    const listings: Listing[] = properties.map(property => ({
        id: property.id,
        name: property.name,
        details: property.description || 'No description',
        imageUrl: property.files && property.files.length > 0 ? property.files[0].url : 'https://via.placeholder.com/400x300?text=No+Image',
        location: property.address,
        status: property.available ? ListingStatus.Listed : ListingStatus.Unlisted,
        price: `₹${property.price.toLocaleString()}`,
        priceValue: property.price
    }));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                
                if (!user) {
                    setError('User not authenticated');
                    return;
                }

                // Fetch real stats from Supabase
                const { data: propertiesData, error: propertiesError } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('owner_id', user.id);

                if (propertiesError) throw propertiesError;

                // Fetch bookings for the owner's properties
                const propertyIds = propertiesData.map((p: any) => p.id);
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from('bookings')
                    .select('*')
                    .in('property_id', propertyIds);

                if (bookingsError) throw bookingsError;

                // Fetch payments for the owner's properties
                const { data: paymentsData, error: paymentsError } = await supabase
                    .from('payments')
                    .select('*')
                    .in('property_id', propertyIds);

                if (paymentsError) throw paymentsError;

                // Calculate stats
                const totalProperties = propertiesData.length;
                const activeBookings = bookingsData.filter((b: any) => b.status === 'confirmed').length;
                
                // Calculate monthly revenue (current month)
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlyRevenue = paymentsData
                    .filter(p => {
                        const paymentDate = new Date((p as any).created_at);
                        return paymentDate.getMonth() === currentMonth &&
                               paymentDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, p) => sum + (p as any).amount, 0);

                // Calculate average rating (if reviews exist)
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('rating')
                    .in('property_id', propertyIds);

                let averageRating = 0;
                if (!reviewsError && reviewsData && reviewsData.length > 0) {
                    const totalRating = reviewsData.reduce((sum, r) => sum + ((r as any).rating || 0), 0);
                    averageRating = totalRating / reviewsData.length;
                }

                const statsData: StatCardData[] = [
                    {
                        title: 'Total Properties',
                        value: totalProperties.toString(),
                        change: '+0', // TODO: Calculate change from previous period
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Active Bookings',
                        value: activeBookings.toString(),
                        change: '+0', // TODO: Calculate change from previous period
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Monthly Revenue',
                        value: `₹${monthlyRevenue.toLocaleString()}`,
                        change: '+0', // TODO: Calculate change from previous period
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Average Rating',
                        value: averageRating.toFixed(1),
                        change: '+0', // TODO: Calculate change from previous period
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    }
                ];

                setStats(statsData);
                setPayments(paymentsData || []);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch owner stats:", err);
                setError("Could not load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleEdit = (id: string | number) => {
        navigate(`/owner/edit-property/${id}`);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            try {
                const { error } = await (supabase as any)
                    .from('properties')
                    .delete()
                    .eq('id', id);

                if (error) {
                    throw error;
                }

                // Refresh the listings
                window.location.reload();
            } catch (err) {
                console.error('Error deleting property:', err);
                alert('Failed to delete property. Please try again.');
            }
        }
    };

    const handleToggleStatus = async (id: string | number) => {
        try {
            // Get current property status
            const { data: property, error: fetchError } = await (supabase as any)
                .from('properties')
                .select('available')
                .eq('id', id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            // Toggle the status
            const newStatus = !property.available;

            const { error: updateError } = await (supabase as any)
                .from('properties')
                .update({ available: newStatus })
                .eq('id', id);

            if (updateError) {
                throw updateError;
            }

            // Refresh the listings
            window.location.reload();
        } catch (err) {
            console.error('Error toggling property status:', err);
            alert('Failed to update property status. Please try again.');
        }
    };

    const handleVerifyPayment = async (paymentId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('payments')
                .update({ status: 'verified' })
                .eq('id', paymentId);

            if (error) throw error;

            // Refresh the payments list
            window.location.reload();
        } catch (err) {
            console.error('Error verifying payment:', err);
            alert('Failed to verify payment. Please try again.');
        }
    };

    const handleRejectPayment = async (paymentId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('payments')
                .update({ status: 'rejected' })
                .eq('id', paymentId);

            if (error) throw error;

            // Refresh the payments list
            window.location.reload();
        } catch (err) {
            console.error('Error rejecting payment:', err);
            alert('Failed to reject payment. Please try again.');
        }
    };

    return (
        <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
            <OwnerSideNavBar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    <OwnerHeader userName={user?.name || 'User'} />
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`px-4 py-2 font-medium text-sm ${activeTab === 'listings' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            My Listings
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`px-4 py-2 font-medium text-sm ${activeTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Payment Verification
                        </button>
                    </div>
                    
                    {loading && <div className="text-center py-10">Loading Dashboard...</div>}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <>
                            {activeTab === 'listings' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {stats.map((stat) => (
                                            <OwnerStatCard
                                                key={stat.title}
                                                {...stat}
                                            />
                                        ))}
                                    </div>
                                    <OwnerListingsTable 
                                        listings={listings} 
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Pending Payment Verifications</h2>
                                        <button 
                                            onClick={() => navigate('/verify-payment')}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                        >
                                            View All Payments
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">Modern Downtown Hostel</h3>
                                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Tenant: John Doe</p>
                                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Booking: Oct 25 - Nov 5, 2024</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-text-light-primary dark:text-text-dark-primary">₹15,000</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                                                        Reject
                                                    </button>
                                                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                                                        Verify
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
                                            <p>No more pending payments to verify.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default OwnerDashboard;