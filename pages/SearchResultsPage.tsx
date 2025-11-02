import React, { useState, useEffect, useMemo } from 'react';
import { Page, Listing } from '../types';
import { getProperties } from '../api';

interface ListingCardProps {
    listing: Listing;
    navigate: (page: Page) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, navigate }) => (
    <div className="flex flex-col gap-3 pb-3 group cursor-pointer" onClick={() => navigate('propertyDetails')}>
        <div className="relative w-full overflow-hidden">
            <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-xl transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url("${listing.imageUrl}")` }}></div>
            <button className="absolute top-3 right-3 text-white">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}> favorite </span>
            </button>
        </div>
        <div>
            <div className="flex justify-between items-start">
                <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">{listing.name}</p>
                <div className="flex items-center gap-1 text-[#111518] dark:text-gray-300">
                    <span className="material-symbols-outlined text-lg text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}> star </span>
                    <span className="text-sm font-medium">{listing.rating}</span>
                </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">{listing.location}</p>
            <p className="text-[#111518] dark:text-white text-sm font-semibold leading-normal mt-1">{listing.price} <span className="font-normal text-gray-600 dark:text-gray-400">/ month</span></p>
        </div>
    </div>
);

const SearchResultsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [allListings, setAllListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                const data = await getProperties();
                setAllListings(data);
                setError(null);
            } catch (err) {
                setError("Failed to fetch properties. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const filteredListings = useMemo(() => {
        const min = minPrice ? parseInt(minPrice) : 0;
        const max = maxPrice ? parseInt(maxPrice) : Infinity;

        return allListings.filter(listing => {
            const price = listing.priceValue ?? 0;
            return price >= min && price <= max;
        });
    }, [allListings, minPrice, maxPrice]);

    return (
        <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-24">
                        <h3 className="text-lg font-bold text-[#111518] dark:text-white mb-4">Filters</h3>
                        <div className="space-y-6 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                            <div>
                                <h4 className="font-bold mb-3 text-[#111518] dark:text-gray-200">Price Range</h4>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <span>₹6,000</span>
                                    <span>₹30,000+</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-center" 
                                    />
                                    <span className="text-gray-500">-</span>
                                     <input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
                <div className="lg:col-span-8 xl:col-span-9">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                         <p className="text-[#111518] dark:text-white text-2xl sm:text-3xl font-black leading-tight tracking-[-0.033em] min-w-72">
                            {loading ? 'Searching for stays...' : `${filteredListings.length > 0 ? `${filteredListings.length}+` : 'No'} stays found`}
                        </p>
                    </div>
                     {loading && <div className="text-center py-10">Loading properties...</div>}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-3 gap-6">
                            {filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} navigate={navigate} />)}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SearchResultsPage;
