
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Listing } from '../types';
import { getProperties } from '../api';

const LandingPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [stayType, setStayType] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [showStayTypeDropdown, setShowStayTypeDropdown] = useState(false);
    const [showPriceRangeDropdown, setShowPriceRangeDropdown] = useState(false);
    const [topProperties, setTopProperties] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stayTypeOptions = ['Hostel', 'PG', 'Co-living'];
    const priceRangeOptions = ['Under ₹5,000', '₹5,000 - ₹10,000', '₹10,000 - ₹15,000', 'Above ₹15,000'];

    useEffect(() => {
        const fetchTopProperties = async () => {
            try {
                setLoading(true);
                const properties = await getProperties();
                // Get top 6 properties sorted by rating
                const topRated = properties
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 6);
                setTopProperties(topRated);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch top properties:', err);
                setError('Failed to load properties. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTopProperties();
    }, []);

    const handleSearch = () => {
        // Navigate to search results with filters
        navigate('/search');
    };

    const handleStayTypeSelect = (option: string) => {
        setStayType(option);
        setShowStayTypeDropdown(false);
    };

    const handlePriceRangeSelect = (option: string) => {
        setPriceRange(option);
        setShowPriceRangeDropdown(false);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111518] dark:text-gray-200">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-10 md:gap-16">
                
                {/* Hero Section with Overlapping Search Bar */}
                <div className="relative mb-16 md:mb-12">
                    <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-center justify-center p-4 text-center" aria-label="Vibrant, modern co-living space with young people interacting" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBT9ls834uSRBR6QcNga1tnsjJUI6lNVrObMuhyG9Etwl-O559TpoWZxFYWU9pz_BCRxAxfIssOFk6_CRuHJ6vIAcJebgkGLmqSv7qwXc5UiJ7mvE0c-Za8c0X-TeifdaEJNUjQl-2otWoOCQpqFswA2tJYgWryrpl__NCX36YT60bsqfRTjI6eWwcmDawhrBfiK3VfLekfyYXtGMh3Kv_4EiZ6gx5-q5thDBBShXVYQEORIn5eKHmFsNsgM0pRTwRswMMcurO3a-Q")' }}>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl">
                                Find Your Community. Find Your Home.
                            </h1>
                            <h2 className="text-white text-sm font-normal leading-normal sm:text-base max-w-2xl mx-auto">
                                Budget-friendly hostels and PGs for students and professionals. Book your perfect stay today.
                            </h2>
                        </div>
                    </div>

                    <div className="absolute bottom-0 translate-y-1/2 w-full z-10 px-4">
                        <div className="max-w-4xl mx-auto bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex-1 w-full">
                                    <span className="material-symbols-outlined text-gray-500">search</span>
                                    <input
                                        className="w-full bg-transparent focus:outline-none text-[#111518] dark:text-gray-200 placeholder-gray-500"
                                        placeholder="Enter a city or area"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 flex-wrap justify-center w-full md:w-auto relative">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowStayTypeDropdown(!showStayTypeDropdown)}
                                            className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-800 px-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <p className="text-[#111518] dark:text-gray-200 text-sm font-medium leading-normal">
                                                {stayType || 'Stay Type'}
                                            </p>
                                            <span className="material-symbols-outlined text-[#111518] dark:text-gray-200">expand_more</span>
                                        </button>
                                        {showStayTypeDropdown && (
                                            <div className="absolute top-full mt-1 w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-20">
                                                {stayTypeOptions.map((option) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => handleStayTypeSelect(option)}
                                                        className="w-full text-left px-4 py-2 text-sm text-[#111518] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPriceRangeDropdown(!showPriceRangeDropdown)}
                                            className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-800 px-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <p className="text-[#111518] dark:text-gray-200 text-sm font-medium leading-normal">
                                                {priceRange || 'Price Range'}
                                            </p>
                                            <span className="material-symbols-outlined text-[#111518] dark:text-gray-200">expand_more</span>
                                        </button>
                                        {showPriceRangeDropdown && (
                                            <div className="absolute top-full mt-1 w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-20">
                                                {priceRangeOptions.map((option) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => handlePriceRangeSelect(option)}
                                                        className="w-full text-left px-4 py-2 text-sm text-[#111518] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={handleSearch} className="flex w-full md:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                    <span className="truncate">Search</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top-Rated Properties */}
                <section>
                    <h2 className="text-[#111518] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Explore Our Top-Rated Properties</h2>
                    {loading && <div className="text-center py-10">Loading properties...</div>}
                    {error && <div className="text-center py-10 text-error">{error}</div>}
                    {!loading && !error && (
                        <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-stretch p-4 gap-4">
                                {topProperties.length > 0 ? (
                                    topProperties.map((property) => (
                                        <div key={property.id} className="flex h-full flex-1 flex-col gap-3 rounded-lg min-w-64 cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => navigate('propertyDetails')}>
                                            <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg" style={{ backgroundImage: `url("${property.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}")` }}></div>
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">{property.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-orange-accent text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        <span className="text-sm font-medium">{property.rating || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">{property.location} - {property.price}/month</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">No properties available at the moment.</div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
                
                {/* Features Section */}
                <section className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Verified Stays</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Every property is manually verified by our team to ensure quality and safety for your peace of mind.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">credit_card</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Secure Payments</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Your booking and payment history, all in one place. Pay securely through our encrypted platform.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Vibrant Community</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Connect with like-minded students and professionals. Join events and build your network.</p>
                        </div>
                    </div>
                </section>
                
                {/* Testimonials Section */}
                <section className="bg-gray-100 dark:bg-gray-900/50 py-12 md:py-20 rounded-xl">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-[#111518] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] mb-8">Hear from our Community</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-background-light dark:bg-surface-dark p-6 rounded-lg shadow-sm text-left flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <img alt="Portrait of Rohan Sharma" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB71zZ2niCwr1eHdZ-9U4g1NXVWYwBN-ius2-nsjy18mrwwDRCU7nUfzoEGSzj8NcNfBhFZ86lvxoCA9XdtSeV3YW_Z4dAsuoWODueLIt8rZXQgta4lymu0mVPH7eBEZviQ-vZ8939xBC6rIFfMR76PZhzCHYgqv5Uvkn3zq3XJn6ryTZYZ_YoeNSh30vCbSxRaTmvHhQ_YEYRH-TXiutaufuXG5PwlUygZuxrC055rjhPa1-gOjDBiJDJnbVJhwFvshv-eq2HKedc" />
                                    <div>
                                        <p className="font-bold text-[#111518] dark:text-white">Rohan Sharma</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Software Engineer</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">"Finding a good PG in Bangalore was a nightmare until I found StayEasy. The process was so simple and the property was exactly as advertised. Highly recommend!"</p>
                                <div className="flex items-center gap-1 text-orange-accent">
                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                </div>
                            </div>
                            <div className="bg-background-light dark:bg-surface-dark p-6 rounded-lg shadow-sm text-left flex flex-col">
                              <div className="flex items-center gap-4 mb-4">
                                  <img alt="Portrait of Priya Mehta" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk0ry2qPtRRG3cgRCm7lWBThAeSO0OR5DKt1O6PcWTq09yC6wfceh8zsvhis0MMcJaZ1bHSPAh8MiMpp_j_0PvYyPRNa_9UK4xH8N1oM6NiPLSMhQqTgJeEVv3ovRqHbrOahoO2JsIfZheSMd_U-3bVYzf9BOAju8UWLoFEoorhFtHNEFGGUGsjWDMmj3lRTYiPpJSqAVt3xuTTdzQTuON75yg8XtzBZEj6o-GTFZNYiafAqazpuBQL8NCxFMyKGVu8bAa35lggJE" />
                                  <div>
                                      <p className="font-bold text-[#111518] dark:text-white">Priya Mehta</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">University Student</p>
                                  </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">"As a student, safety was my top priority. StayEasy's verified listings gave me and my parents peace of mind. The community events are a great bonus!"</p>
                              <div className="flex items-center gap-1 text-orange-accent">
                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                              </div>
                          </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-10 pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">StayEasy</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('/')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">About Us</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Discover</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('/')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">Trust & Safety</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Hosting</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('/dashboard/owner')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">List your property</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Support</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => navigate('/')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">Help Center</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>© 2024 StayEasy, Inc. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;