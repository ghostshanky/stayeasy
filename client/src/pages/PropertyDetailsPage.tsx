import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageHostModal from '../components/MessageHostModal';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';
import { apiClient, API_ENDPOINTS } from '../config/api';
import { BRAND } from '../config/brand';

const PropertyDetailsPage = () => {
    const { id: propertyId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // We fetch reviews using the hook
    const { items: reviews, loading: reviewsLoading } = useReviews(propertyId, 10, 1);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [property, setProperty] = useState<any>(null);
    const [hostName, setHostName] = useState('');
    const [hostId, setHostId] = useState('');
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);

    const handleRequestToBook = async () => {
        if (!property || !user) {
            alert('Please login to make a booking');
            return;
        }

        // For now, let's create a simple booking with default dates
        // In a real app, you'd want a date selection modal
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1); // Start from tomorrow
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + 7); // 7 days stay

        setBookingLoading(true);
        try {
            const response = await apiClient.post(API_ENDPOINTS.bookings.create, {
                propertyId: property.id,
                checkIn: checkIn.toISOString(),
                checkOut: checkOut.toISOString()
            });

            if (response.success && response.data) {
                const booking = response.data;
                // Navigate to confirm page with booking ID
                navigate(`/confirm?bookingId=${booking.id}`);
            } else {
                alert('Failed to create booking: ' + (response.error?.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking: ' + (error.message || 'Unknown error'));
        } finally {
            setBookingLoading(false);
        }
    };

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/api/properties/${propertyId}`);
                if (response.success && response.data) {
                    const propertyData = response.data;

                    // Ensure images is an array and handle fallback
                    let images = propertyData.images || [];
                    if (typeof images === 'string') {
                        try {
                            images = JSON.parse(images);
                        } catch (e) {
                            images = [images];
                        }
                    }
                    if (!Array.isArray(images) || images.length === 0) {
                        images = [BRAND.defaultAvatar];
                    }

                    // Ensure we have at least 5 images for the grid layout by repeating if necessary
                    while (images.length < 5) {
                        images = [...images, ...images].slice(0, 5);
                    }

                    setProperty({
                        ...propertyData,
                        images: images,
                        rating: propertyData.rating || 0,
                        price_per_night: propertyData.pricePerNight || propertyData.price_per_night || 0
                    });

                    // Set host name if available
                    if (propertyData.owner) {
                        setHostName(propertyData.owner.name || 'Host');
                        setHostId(propertyData.owner.id || '');
                    }
                }
            } catch (error) {
                console.error('Error fetching property details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchPropertyDetails();
        }
    }, [propertyId]);

    return (
        <>
            <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
                <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
                                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading property details...</p>
                            </div>
                        </div>
                    ) : property ? (
                        <>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button onClick={() => navigate('/')} className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium">Home</button>
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                                <button onClick={() => navigate('/search')} className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium">Properties</button>
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                                <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{property.title || property.name}</span>
                            </div>
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <div className="flex flex-col gap-2">
                                    <p className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">{property.title || property.name}</p>
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
                                <div className="col-span-2 row-span-2 bg-center bg-no-repeat bg-cover" aria-label="Main view of the property" style={{ backgroundImage: `url("${property.images[0]}")` }}></div>
                                <div className="bg-center bg-no-repeat bg-cover" aria-label="Property view 2" style={{ backgroundImage: `url("${property.images[1]}")` }}></div>
                                <div className="bg-center bg-no-repeat bg-cover" aria-label="Property view 3" style={{ backgroundImage: `url("${property.images[2]}")` }}></div>
                                <div className="bg-center bg-no-repeat bg-cover" aria-label="Property view 4" style={{ backgroundImage: `url("${property.images[3]}")` }}></div>
                                <div className="relative bg-center bg-no-repeat bg-cover" aria-label="Property view 5" style={{ backgroundImage: `url("${property.images[4]}")` }}>
                                    <button className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center text-white font-bold hover:bg-black/50">Show all photos</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2">
                                    <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-gray-900 dark:text-white text-xl font-bold">Hosted by {hostName}</h2>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {property.capacity} Guests • {property.amenities?.length || 0} Amenities
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4">What this place offers</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {property.amenities && property.amenities.length > 0 ? (
                                                property.amenities.map((amenity: string, index: number) => {
                                                    // Simple mapping for common amenities
                                                    let icon = 'check_circle';
                                                    const lowerAmenity = amenity.toLowerCase();
                                                    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) icon = 'wifi';
                                                    else if (lowerAmenity.includes('ac') || lowerAmenity.includes('air')) icon = 'ac_unit';
                                                    else if (lowerAmenity.includes('tv')) icon = 'tv';
                                                    else if (lowerAmenity.includes('kitchen')) icon = 'kitchen';
                                                    else if (lowerAmenity.includes('parking')) icon = 'local_parking';
                                                    else if (lowerAmenity.includes('gym')) icon = 'fitness_center';
                                                    else if (lowerAmenity.includes('pool')) icon = 'pool';
                                                    else if (lowerAmenity.includes('laundry') || lowerAmenity.includes('washer')) icon = 'local_laundry_service';

                                                    return (
                                                        <div key={index} className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">{icon}</span>
                                                            <span className="text-gray-600 dark:text-gray-300">{amenity}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400">No amenities listed.</p>
                                            )}
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
                                            ₹{property.price_per_night.toLocaleString()} <span className="text-base font-normal text-gray-500 dark:text-gray-400">/ night</span>
                                        </p>
                                        <div className="space-y-4">
                                            <button onClick={handleRequestToBook} className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-colors">
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
                        </>
                    ) : (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">error</span>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Property not found</h3>
                                <p className="text-gray-500 dark:text-gray-400">The property you're looking for doesn't exist.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <MessageHostModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                hostName={hostName}
                hostId={hostId}
                propertyId={propertyId}
            />
        </>
    );
};

export default PropertyDetailsPage;