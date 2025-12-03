import React, { useState, useEffect } from 'react';
import { Page, Listing, ListingStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { useOwnerProperties } from '../hooks/useOwnerProperties';
import { BRAND } from '../config/brand';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';
import { TableRowSkeleton } from '../components/common/SkeletonLoader';

const convertToListing = (property: any): Listing => ({
    id: property.id,
    name: property.name,
    details: property.description || 'No description available',
    imageUrl: property.files?.[0]?.url || property.images?.[0] || BRAND.defaultPropertyImage,
    location: property.address,
    status: property.available ? ListingStatus.Listed : ListingStatus.Unlisted,
    rating: 0,
    price: `₹${property.price?.toLocaleString() || '0'}`,
    priceValue: property.price || 0
});

const MyListingsPage = () => {
    const navigate = useNavigate();
    const { items: properties, loading, error } = useOwnerProperties();
    const [listings, setListings] = useState<Listing[]>([]);

    useEffect(() => {
        if (properties) {
            const convertedListings = properties.map(convertToListing);
            setListings(convertedListings);
        }
    }, [properties]);

    return (
        <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
            <OwnerSideNavBar onNavigate={navigate} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    <OwnerHeader userName="Alex" />
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">My Listings</h1>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary">Manage your property listings</p>
                    </div>

                    {loading && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Property</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(5)].map((_, i) => (
                                            <TableRowSkeleton key={i} columns={4} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <OwnerListingsTable
                            listings={listings}
                            onEdit={(id) => console.log('Edit listing:', id)}
                            onDelete={(id) => {
                                if (confirm('Are you sure you want to delete this listing?')) {
                                    console.log('Delete listing:', id);
                                }
                            }}
                            onToggleStatus={(id) => console.log('Toggle status:', id)}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyListingsPage;
