import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Page } from '../types';
import MessageHostModal from '../components/MessageHostModal';
import { sendMessage } from '../client/src/lib/messages';
import { useProperties } from '../client/src/hooks/useProperties';
import { useReviews } from '../client/src/hooks/useReviews';

const PropertyDetailsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const { id: propertyId } = useParams<{ id: string }>();
    const { items: properties, loading: propertiesLoading } = useProperties(1, 1);
    const { items: reviews, loading: reviewsLoading } = useReviews(propertyId, 10, 1);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    
    // For now, we'll use the first property from the list as a placeholder
    // In a real implementation, we would fetch the specific property by ID
    const property = properties[0] || {
        id: propertyId || '1',
        title: 'Modern & Cozy PG near Andheri West',
        location: 'Andheri West, Mumbai, Maharashtra',
        price_per_night: 15000,
        images: [
            'https://via.placeholder.com/800x600',
            'https://via.placeholder.com/800x600',
            'https://via.placeholder.com/800x600',
            'https://via.placeholder.com/800x600',
            'https://via.placeholder.com/800x600'
        ],
        rating: 4.8
    };

    const hostName = "Priya"; // This would typically come from property data

    return (
        <>
            <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
                <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => navigate('landing')} className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium">Home</button>
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                        <button onClick={() => navigate('searchResults')} className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium">Mumbai</button>
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{property.title}</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">{property.title}</p>
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">star</span>
                                    <span>{property.rating} ({reviews.length} Reviews)</span>
                                </div>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>{property.location}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex gap-2 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">
                                <span className="material-symbols-outlined text-base">ios_share</span>
                                <span className="truncate">Share</span>
                            </button>
                            <button className="flex gap-2 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">
                                <span className="material-symbols-outlined text-base">favorite</span>
                                <span className="truncate">Save</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-2 gap-2 mb-10 h-[500px] rounded-xl overflow-hidden">
                        <div className="col-span-2 row-span-2 bg-center bg-no-repeat bg-cover" aria-label="Main view of the hostel room with a bed and a desk" style={{ backgroundImage: `url("${property.images[0]}")` }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Common area with sofas and a coffee table" style={{ backgroundImage: `url("${property.images[1]}")` }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Clean and modern bathroom with a shower" style={{ backgroundImage: `url("${property.images[2]}")` }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Kitchenette area with microwave and fridge" style={{ backgroundImage: `url("${property.images[3]}")` }}></div>
                        <div className="relative bg-center bg-no-repeat bg-cover" aria-label="Exterior view of the building" style={{ backgroundImage: `url("${property.images[4]}")` }}>
                            <button className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center text-white font-bold hover:bg-black/50">Show all photos</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">Private Room in a PG hosted by Priya</h2>
                                        <p className="text-gray-500 dark:text-gray-400">2-person sharing • 1 Bathroom • Kitchenette</p>
                                    </div>
                                </div>
                            </div>
                            <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4">What this place offers</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">wifi</span><span className="text-gray-600 dark:text-gray-300">High-speed Wi-Fi</span></div>
                                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">ac_unit</span><span className="text-gray-600 dark:text-gray-300">Air Conditioning</span></div>
                                </div>
                            </div>
                            <div className="py-6">
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">star</span>
                                    <span>{property.rating} • {reviews.length} Reviews</span>
                                </h3>
                                {/* Reviews would be displayed here using the reviews data */}
                                {reviewsLoading ? (
                                    <div>Loading reviews...</div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map(review => (
                                            <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                                <div className="flex justify-between">
                                                    <div className="font-medium">{review.user?.name || 'Anonymous'}</div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-orange-500">star</span>
                                                        <span>{review.rating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="mt-2">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    ₹{property.price_per_night} <span className="text-base font-normal text-gray-500 dark:text-gray-400">/ month</span>
                                </p>
                                <div className="space-y-4">
                                    <button onClick={() => navigate('confirmAndPay')} className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-colors">
                                        <span>Request to Book</span>
                                    </button>
                                    <button onClick={() => setIsMessageModalOpen(true)} className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                        <span>Contact Owner</span>
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">You won't be charged yet</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <MessageHostModal 
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                hostName={hostName}
                propertyId={propertyId}
            />
        </>
    );
};

export default PropertyDetailsPage;