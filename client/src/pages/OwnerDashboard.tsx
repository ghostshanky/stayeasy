import React, { useState, useEffect } from 'react';
import { Page, Listing, ListingStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerStatsCards from '../components/owner/OwnerStatsCards';
import OwnerRecentBookings from '../components/owner/OwnerRecentBookings';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';
import { useOwnerProperties } from '../hooks/useOwnerProperties';
import { useOwnerStats } from '../hooks/useOwnerStats';
import { useOwnerBookings } from '../hooks/useOwnerBookings';
import { BRAND } from '../config/brand';
import { useAuth } from '../hooks/useAuth';

const convertToListing = (property: any): Listing => ({
    id: property.id,
    name: property.name,
    details: property.description || 'No description',
    imageUrl: property.files && property.files.length > 0 ? property.files[0].url : BRAND.defaultPropertyImage,
    location: property.address,
    status: property.available ? ListingStatus.Listed : ListingStatus.Unlisted,
    price: `₹${property.price.toLocaleString()}`,
    priceValue: property.price
});

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items: properties, loading: propertiesLoading, error: propertiesError } = useOwnerProperties();
    const { stats, loading: statsLoading, error: statsError } = useOwnerStats();
    const { items: bookings, loading: bookingsLoading, error: bookingsError } = useOwnerBookings(user?.id || '');

    const [listings, setListings] = useState<Listing[]>([]);

    useEffect(() => {
        if (properties) {
            const convertedListings = properties.map(convertToListing);
            setListings(convertedListings);
        }
    }, [properties]);

    const handleNavigate = (page: Page) => {
        // This function is kept for compatibility if needed, but we use useNavigate mostly
        console.log('Navigate to:', page);
    };

    return (
        <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
            <OwnerSideNavBar onNavigate={navigate} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    <OwnerHeader userName={user?.name || "Owner"} />
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Dashboard</h1>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary">Welcome back, here's what's happening with your properties.</p>
                    </div>

                    {statsLoading && <div>Loading stats...</div>}
                    {statsError && <div className="text-error">Error loading stats: {statsError}</div>}
                    {!statsLoading && !statsError && stats && (
                        <OwnerStatsCards stats={stats} />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        <div className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">Your Properties</h2>
                                <button
                                    onClick={() => navigate('/my-listings')}
                                    className="text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                    View All
                                </button>
                            </div>
                            {propertiesLoading && <div>Loading properties...</div>}
                            {propertiesError && <div className="text-error">Error loading properties: {propertiesError}</div>}
                            {!propertiesLoading && !propertiesError && (
                                <OwnerListingsTable
                                    listings={listings.slice(0, 3)}
                                    onEdit={(id) => console.log('Edit', id)}
                                    onDelete={(id) => console.log('Delete', id)}
                                    onToggleStatus={(id) => console.log('Toggle', id)}
                                />
                            )}
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">Recent Bookings</h2>
                                <button
                                    onClick={() => navigate('/owner-bookings')}
                                    className="text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                    View All
                                </button>
                            </div>
                            {bookingsLoading && <div>Loading bookings...</div>}
                            {bookingsError && <div className="text-error">Error loading bookings: {bookingsError}</div>}
                            {!bookingsLoading && !bookingsError && (
                                <OwnerRecentBookings bookings={bookings.slice(0, 5)} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;