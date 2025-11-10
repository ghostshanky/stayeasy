import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { supabase } from '../client/src/lib/supabase';
import QRCodeGenerator from '../components/QRCodeGenerator';

interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  total_amount: number;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    title: string;
    location: string;
    price_per_night: number;
    images: string[];
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const ConfirmAndPayPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [upiId, setUpiId] = useState('kunalsable24@okaxis');
    const [merchantName, setMerchantName] = useState('StayEasy');
    
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
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError('Please login to continue');
                    setLoading(false);
                    return;
                }

                const { data: bookingData, error } = await supabase
                    .from("bookings")
                    .select(`
                        id,
                        user_id,
                        property_id,
                        check_in,
                        check_out,
                        status,
                        total_amount,
                        created_at,
                        updated_at,
                        property:properties(
                            id,
                            title,
                            location,
                            price_per_night,
                            images,
                            owner:users(id, name, email)
                        )
                    `)
                    .eq('id', bookingId)
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    throw error;
                }

                setBooking(bookingData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Failed to load booking details');
                setLoading(false);
            }
        };
        getBooking();
    }, []);

    const handleCreatePayment = async () => {
        if (!booking) return;

        setProcessingPayment(true);
        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: booking.total_amount,
                    upiId,
                    merchantName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setPaymentId(data.paymentId);
                setShowQRModal(true);
            } else {
                const errorData = await response.json();
                alert('Failed to create payment: ' + errorData.error?.message);
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Failed to create payment');
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
                            onClick={() => navigate('bookings')}
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
                            onClick={() => navigate('bookings')}
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
                        onClick={() => navigate('bookings')}
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
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {booking.property.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {booking.property.location}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {formatDate(booking.check_in)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Check-out:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {formatDate(booking.check_out)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Nights:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Price/Night:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                                        {formatCurrency(booking.property.price_per_night)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total Amount
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(booking.total_amount)}
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
                {showQRModal && paymentId && (
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
                                    amount={booking.total_amount}
                                    note={`StayEasy Payment - ${paymentId}`}
                                />
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <p><strong>Property:</strong> {booking.property.title}</p>
                                <p><strong>Amount:</strong> {formatCurrency(booking.total_amount)}</p>
                                <p><strong>Booking:</strong> {formatDate(booking.check_in)} - {formatDate(booking.check_out)}</p>
                                <p><strong>Payment ID:</strong> {paymentId}</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowQRModal(false);
                                        navigate('payments');
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
