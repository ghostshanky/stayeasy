import React, { useState, useEffect } from 'react';
import { Page, Listing } from '../types';
import { getOwnerProperties } from '../api';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';

const MyListingsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                const listingsData = await getOwnerProperties();
                setListings(listingsData);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch listings:", err);
                setError("Could not load listings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

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

                    {loading && <div className="text-center py-10">Loading listings...</div>}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <OwnerListingsTable listings={listings} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyListingsPage;
