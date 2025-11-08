import React, { useState, useEffect } from 'react';
import { Page, Listing, StatCardData, StatChangeDirection, ListingStatus } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerStatCard from '../components/owner/OwnerStatCard';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';
import { useOwnerProperties } from '../client/src/hooks/useOwnerProperties';
import { supabase } from '../client/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = ({ navigate: pageNavigate }: { navigate: (page: Page) => void }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<StatCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'payments'
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
                // In a real app, this would fetch actual stats from the backend
                const mockStats: StatCardData[] = [
                    {
                        title: 'Total Properties',
                        value: '5',
                        change: '+2',
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Active Bookings',
                        value: '12',
                        change: '+3',
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Monthly Revenue',
                        value: '₹45,000',
                        change: '+15%',
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    },
                    {
                        title: 'Average Rating',
                        value: '4.7',
                        change: '+0.2',
                        changeDirection: StatChangeDirection.Increase,
                        changeColorClass: 'text-green-600'
                    }
                ];
                setStats(mockStats);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch owner stats:", err);
                setError("Could not load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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

    return (
        <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
            <OwnerSideNavBar onNavigate={pageNavigate} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    <OwnerHeader userName="Alex" />
                    
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
                                            onClick={() => pageNavigate('paymentVerification')}
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