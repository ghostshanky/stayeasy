import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import QRCodeGenerator from '../components/QRCodeGenerator';
import toast from 'react-hot-toast';
import { BRAND } from '../config/brand';

interface Booking {
    id: string;
    user_id: string;
    property_id: string;
    check_in: string;
    check_out: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    guests: number;
    payment_status: string;
    created_at: string;
    updated_at: string;
    properties?: {
        id: string;
        title: string;
        location: string;
        images?: string[];
        price?: number;
    };
    tenant?: {
        id: string;
        name: string;
        email: string;
    };
    owner?: {
        id: string;
        name: string;
        email: string;
    };
}

interface BookingFormData {
    id: string;
    userId: string;
    propertyId: string;
    checkIn: string;
    checkOut: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    guests: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    property: {
        id: string;
        title: string;
        location: string;
        pricePerNight: number;
        images: string[];
        owner: {
            id: string;
            name: string;
            email: string;
        };
    };
}

const ConfirmAndPayPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState<BookingFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [upiId, setUpiId] = useState('kunalsable24@okaxis');
    const [merchantName, setMerchantName] = useState('StayEasy');

    // Date selection states
    const [editingDates, setEditingDates] = useState(false);
    const [tempCheckIn, setTempCheckIn] = useState('');
    const [tempCheckOut, setTempCheckOut] = useState('');
    const [updatingDates, setUpdatingDates] = useState(false);

    useEffect(() => {
        const getBooking = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const bookingId = urlParams.get('bookingId');

            if (!bookingId) {
                setError('Booking ID is required');
                setLoading(false);
                return;
            }

            try {
                const response = await apiClient.get(API_ENDPOINTS.bookings.details(bookingId));

                if (response.success && response.data) {
                    // Map the API response to match our interface
                    const bookingData: BookingFormData = {
                        id: (response.data as any).id || '',
                        userId: (response.data as any).user_id || '',
                        propertyId: (response.data as any).property_id || '',
                        checkIn: (response.data as any).check_in || '',
                        checkOut: (response.data as any).check_out || '',
                        status: (response.data as any).status || 'PENDING',
                        guests: (response.data as any).guests || 1,
                        paymentStatus: (response.data as any).payment_status || '',
                        createdAt: (response.data as any).created_at || '',
                        updatedAt: (response.data as any).updated_at || '',
                        property: (response.data as any).properties || {
                            id: (response.data as any).property_id || '',
                            title: 'Unknown Property',
                            location: 'Unknown Location',
                            pricePerNight: (response.data as any).properties?.pricePerNight || (response.data as any).property?.pricePerNight || 0,
                            images: [],
                            owner: {
                                id: '',
                                name: '',
                                email: ''
                            }
                        }
                    };
                    setBooking(bookingData);
                } else {
                    throw new Error(response.error?.message || 'Failed to load booking details');
                }
            } catch (err: any) {
                console.error('Error fetching booking:', err);
                setError(err.message || 'Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            getBooking();
        }
    }, [user]);

    const handleCreatePayment = async () => {
        if (!booking) return;

        // Calculate total amount based on nights and price per night
        const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = booking.property.pricePerNight * nights;

        setProcessingPayment(true);
        try {
            const response = await apiClient.post(API_ENDPOINTS.payments.create, {
                bookingId: booking.id,
                amount: totalAmount,
                upiId,
            });

            if (response.success && response.data) {
                setPaymentId((response.data as any)?.paymentId || 'payment-generated');
                setShowQRModal(true);
            } else {
                toast.error('Failed to create payment: ' + (response.error?.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Error creating payment:', error);
            toast.error('Failed to create payment: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateTotalAmount = (booking: BookingFormData) => {
        if (!booking) return 0;
        const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
        return booking.property.pricePerNight * nights;
    };

    const calculateNights = (checkIn: string, checkOut: string) => {
        if (!checkIn || !checkOut) return 0;
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 0;
    };

    const handleEditDates = () => {
        if (!booking) return;
        setTempCheckIn(booking.checkIn);
        setTempCheckOut(booking.checkOut);
        setEditingDates(true);
    };

    const handleSaveDates = async () => {
        if (!booking || !tempCheckIn || !tempCheckOut) return;

        // Validate dates
        const checkInDate = new Date(tempCheckIn);
        const checkOutDate = new Date(tempCheckOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            toast.error('Check-in date cannot be in the past');
            return;
        }

        if (checkOutDate <= checkInDate) {
            toast.error('Check-out date must be after check-in date');
            return;
        }

        setUpdatingDates(true);
        try {
            const response = await apiClient.put(API_ENDPOINTS.bookings.update(booking.id), {
                check_in: tempCheckIn,
                check_out: tempCheckOut,
            });

            if (response.success && response.data) {
                // Update the booking with the new dates while preserving other data
                const updatedBooking = {
                    ...booking,
                    checkIn: tempCheckIn,
                    checkOut: tempCheckOut,
                    id: (response.data as any).id || booking.id,
                    userId: (response.data as any).user_id || booking.userId,
                    propertyId: (response.data as any).property_id || booking.propertyId,
                    status: (response.data as any).status || booking.status,
                    guests: (response.data as any).guests || booking.guests,
                    paymentStatus: (response.data as any).payment_status || booking.paymentStatus,
                    createdAt: (response.data as any).created_at || booking.createdAt,
                    updatedAt: (response.data as any).updated_at || booking.updatedAt,
                };
                setBooking(updatedBooking);
                setEditingDates(false);
                toast.success('Booking dates updated successfully');
            } else {
                throw new Error(response.error?.message || 'Failed to update booking dates');
            }
        } catch (error: any) {
            console.error('Error updating booking dates:', error);
            toast.error('Failed to update booking dates: ' + (error.message || 'Unknown error'));
        } finally {
            setUpdatingDates(false);
        }
    };

    const handleCancelDates = () => {
        setEditingDates(false);
        setTempCheckIn('');
        setTempCheckOut('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-8"></div>

                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <div className="space-y-4">
                                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                </div>

                                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded mt-8"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Error
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Back to Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Booking Not Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            The booking you're looking for doesn't exist.
                        </p>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Back to Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Bookings
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                        Confirm & Pay
                    </h1>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Complete your booking payment for {booking.property.title}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Property Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Property Details
                        </h2>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <img
                                    src={booking.property.images?.[0] || BRAND.defaultPropertyImage}
                                    alt={booking.property.title}
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {booking.property.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {booking.property.location}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
                                    {editingDates ? (
                                        <input
                                            type="date"
                                            value={tempCheckIn}
                                            onChange={(e) => setTempCheckIn(e.target.value)}
                                            className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    ) : (
                                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                            {formatDate(booking.checkIn)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Check-out:</span>
                                    {editingDates ? (
                                        <input
                                            type="date"
                                            value={tempCheckOut}
                                            onChange={(e) => setTempCheckOut(e.target.value)}
                                            className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                            min={tempCheckIn || new Date().toISOString().split('T')[0]}
                                        />
                                    ) : (
                                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                            {formatDate(booking.checkOut)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Nights:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {editingDates ? calculateNights(tempCheckIn, tempCheckOut) : calculateNights(booking.checkIn, booking.checkOut)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Price/Night:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {formatCurrency(booking.property.pricePerNight)}
                                    </span>
                                </div>
                            </div>

                            {editingDates && (
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSaveDates}
                                        disabled={updatingDates}
                                        className="flex-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        {updatingDates ? 'Updating...' : 'Save Dates'}
                                    </button>
                                    <button
                                        onClick={handleCancelDates}
                                        className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {!editingDates && (
                                <button
                                    onClick={handleEditDates}
                                    className="mt-4 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Edit Dates
                                </button>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total Amount
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(editingDates ?
                                            booking.property.pricePerNight * calculateNights(tempCheckIn, tempCheckOut) :
                                            calculateTotalAmount(booking)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Payment Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter UPI ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Merchant Name
                                </label>
                                <input
                                    type="text"
                                    value={merchantName}
                                    onChange={(e) => setMerchantName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter merchant name"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    Payment Instructions
                                </h4>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <li>• Scan the QR code with any UPI app</li>
                                    <li>• Enter the exact amount shown</li>
                                    <li>• Use your UPI ID to complete payment</li>
                                    <li>• Keep the transaction ID for reference</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleCreatePayment}
                                disabled={processingPayment}
                                className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {processingPayment ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin mr-2">⏳</span>
                                        Creating Payment...
                                    </span>
                                ) : (
                                    'Proceed to Payment'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* QR Code Modal */}
                {showQRModal && paymentId && booking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Complete Payment
                                </h3>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="text-center mb-6">
                                <QRCodeGenerator
                                    upiId={upiId}
                                    amount={calculateTotalAmount(booking)}
                                    note={`StayEasy Payment - ${paymentId}`}
                                />
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <p><strong>Property:</strong> {booking.property.title}</p>
                                <p><strong>Amount:</strong> {formatCurrency(calculateTotalAmount(booking))}</p>
                                <p><strong>Booking:</strong> {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                                <p><strong>Payment ID:</strong> {paymentId}</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            await apiClient.post(API_ENDPOINTS.payments.confirm, {
                                                paymentId,
                                                upiReference: 'manual-confirm'
                                            });
                                            toast.success('Payment submitted for verification');
                                            setShowQRModal(false);
                                            navigate('/payments');
                                        } catch (error) {
                                            console.error('Error confirming payment:', error);
                                            toast.error('Failed to confirm payment status');
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    ✅ Payment Completed
                                </button>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Continue Later
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmAndPayPage;


