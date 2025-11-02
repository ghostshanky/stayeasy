import React, { useState, useEffect } from 'react';
import { Page, Listing, StatCardData } from '../types';
import { getOwnerStats, getOwnerProperties } from '../api';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerStatCard from '../components/owner/OwnerStatCard';
import OwnerListingsTable from '../components/owner/OwnerListingsTable';


const OwnerDashboard = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [stats, setStats] = useState<StatCardData[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, listingsData] = await Promise.all([
                    getOwnerStats(),
                    getOwnerProperties(),
                ]);
                setStats(statsData);
                setListings(listingsData);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch owner data:", err);
                setError("Could not load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
            <OwnerSideNavBar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mx-auto max-w-7xl">
                    <OwnerHeader userName="Alex" />
                    {loading && <div className="text-center py-10">Loading Dashboard...</div>}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {stats.map((stat) => (
                                    <OwnerStatCard
                                        key={stat.title}
                                        {...stat}
                                    />
                                ))}
                            </div>
                            <OwnerListingsTable listings={listings} />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default OwnerDashboard;