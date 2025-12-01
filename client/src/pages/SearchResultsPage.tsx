
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { PropertyCardSkeleton } from '../components/common';

interface Property {
    id: string;
    name: string;
    location: string;
    price: string;
    priceValue: number;
    images?: string[];
    imageUrl?: string;
    rating?: number;
}

const ListingCard: React.FC<{ listing: Property }> = ({ listing }) => {
    const navigate = useNavigate();

    const handlePropertyClick = () => {
        navigate(`/property/${listing.id}`);
    };

    return (
        <div className="flex flex-col gap-3 pb-3 group cursor-pointer" onClick={handlePropertyClick}>
            <div className="relative w-full overflow-hidden">
                <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-xl transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url("${listing.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}")` }}></div>
                <button className="absolute top-3 right-3 text-white">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}> favorite </span>
                </button>
            </div>
            <div>
                <div className="flex justify-between items-start">
                    <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">{listing.name}</p>
                    <div className="flex items-center gap-1 text-[#111518] dark:text-gray-300">
                        <span className="material-symbols-outlined text-lg text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}> star </span>
                        <span className="text-sm font-medium">{listing.rating || 'New'}</span>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">{listing.location}</p>
                <p className="text-[#111518] dark:text-white text-sm font-semibold leading-normal mt-1">{listing.price} <span className="font-normal text-gray-600 dark:text-gray-400">/ night</span></p>
            </div>
        </div>
    );
};

const SearchResultsPage = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProperties, setTotalProperties] = useState(0);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        city: '',
        amenities: ''
    });
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Read URL parameters on component mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const city = params.get('city') || '';
        const minPrice = params.get('minPrice') || '';
        const maxPrice = params.get('maxPrice') || '';
        const amenities = params.get('amenities') || '';

        setFilters({
            minPrice,
            maxPrice,
            city,
            amenities
        });
    }, []);

    // Fetch properties with filters and pagination
    const fetchProperties = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12'
            });

            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.city) params.append('city', filters.city);
            if (filters.amenities) params.append('amenities', filters.amenities);

            const response = await apiClient.get(`/properties?${params}`);

            console.log('🔍 [SearchResults] API Response:', {
                success: response.success,
                dataLength: response.data?.length,
                hasPagination: !!response.pagination
            });

            if (response.success && response.data) {
                // Transform the data to match the expected Property interface
                const transformedProperties = response.data.map((prop: any) => ({
                    id: prop.id,
                    name: prop.title || prop.name || 'Unnamed Property',
                    location: prop.location || prop.address || 'Unknown Location',
                    price: prop.price_per_night ? `₹${prop.price_per_night}` : 'Price not available',
                    priceValue: prop.price_per_night || 0,
                    images: prop.images || [],
                    imageUrl: prop.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
                    rating: prop.rating || 0
                }));

                setProperties(transformedProperties);
                setTotalPages(response.pagination?.totalPages || 1);
                setTotalProperties(response.pagination?.total || transformedProperties.length);
                console.log('✅ [SearchResults] Properties loaded:', transformedProperties.length);
            } else {
                console.error('❌ [SearchResults] Failed to fetch:', response.error);
                throw new Error(response.error?.message || 'Failed to fetch properties');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching properties');
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [currentPage, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-24">
                        <h3 className="text-lg font-bold text-[#111518] dark:text-white mb-4">Filters</h3>
                        <div className="space-y-6 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                            <div>
                                <h4 className="font-bold mb-3 text-[#111518] dark:text-gray-200">Location</h4>
                                <input
                                    type="text"
                                    placeholder="City or area"
                                    value={filters.city}
                                    onChange={(e) => handleFilterChange('city', e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                />
                            </div>

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
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-center"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-3 text-[#111518] dark:text-gray-200">Amenities</h4>
                                <input
                                    type="text"
                                    placeholder="e.g., WiFi, Parking, Kitchen"
                                    value={filters.amenities}
                                    onChange={(e) => handleFilterChange('amenities', e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                />
                            </div>

                            <button
                                onClick={() => setFilters({ minPrice: '', maxPrice: '', city: '', amenities: '' })}
                                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </aside>
                <div className="lg:col-span-8 xl:col-span-9">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <p className="text-[#111518] dark:text-white text-2xl sm:text-3xl font-black leading-tight tracking-[-0.033em] min-w-72">
                            {loading ? 'Searching for stays...' : `${totalProperties}+ stays found`}
                        </p>
                    </div>

                    {error && <div className="text-center py-10 text-error">{error}</div>}

                    <div className="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-3 gap-6">
                        {loading ? (
                            // Show skeleton loaders while loading
                            Array.from({ length: 12 }).map((_, index) => (
                                <PropertyCardSkeleton key={index} />
                            ))
                        ) : properties.length > 0 ? (
                            properties.map(property => <ListingCard key={property.id} listing={property} />)
                        ) : (
                            <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                                No properties found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && !error && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 rounded-lg transition-colors ${currentPage === page
                                            ? 'bg-blue-500 text-white'
                                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SearchResultsPage;