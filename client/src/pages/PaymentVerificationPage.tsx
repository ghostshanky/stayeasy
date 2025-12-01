
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { useNavigate } from 'react-router-dom';
import { usePendingPayments } from '../hooks/usePayments';
import { supabase } from '../lib/supabase';
import QRCodeGenerator from '../components/QRCodeGenerator';

const PaymentVerificationPage = () => {
    const navigate = useNavigate();
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [confirmingPayment, setConfirmingPayment] = useState(false);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [rejectingPayment, setRejectingPayment] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setOwnerId(user.id);
            }
        };
        getUser();
    }, []);

    const { items: pendingPayments, loading, error } = usePendingPayments(ownerId || '');

    const handleVerifyPayment = async (paymentId: string) => {
        setVerifyingPayment(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    verified: true,
                    note: ''
                }),
            });

            if (response.ok) {
                // Refresh pending payments
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert('Failed to verify payment: ' + errorData.error?.message);
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Failed to verify payment');
        } finally {
            setVerifyingPayment(false);
        }
    };

    const handleRejectPayment = async (paymentId: string) => {
        if (!rejectionNote.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setRejectingPayment(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    verified: false,
                    note: rejectionNote
                }),
            });

            if (response.ok) {
                // Refresh pending payments
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert('Failed to reject payment: ' + errorData.error?.message);
            }
        } catch (error) {
            console.error('Error rejecting payment:', error);
            alert('Failed to reject payment');
        } finally {
            setRejectingPayment(false);
            setRejectionNote('');
        }
    };

    const handleConfirmPayment = async (paymentId: string) => {
        setConfirmingPayment(true);
        try {
            const response = await fetch('/api/payments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    upiReference: ''
                }),
            });

            if (response.ok) {
                setShowQRModal(false);
                setSelectedPayment(null);
                // Refresh pending payments
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert('Failed to confirm payment: ' + errorData.error?.message);
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Failed to confirm payment');
        } finally {
            setConfirmingPayment(false);
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('ownerDashboard')}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                            Payment Verification
                        </h1>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
                            Review and verify tenant payments for your properties
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 animate-pulse">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('ownerDashboard')}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                            Payment Verification
                        </h1>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
                            Review and verify tenant payments for your properties
                        </p>
                    </div>

                    <div className="text-center py-8">
                        <p className="text-red-500">Error loading payments: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('ownerDashboard')}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                        Payment Verification
                    </h1>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
                        Review and verify tenant payments for your properties
                    </p>
                </div>

                {pendingPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No Pending Payments
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            All payments have been processed. No action required at this time.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingPayments.map((payment) => (
                            <div key={payment.id} className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-[#111518] dark:text-white text-lg">
                                                {payment.booking?.property?.name || 'Unknown Property'}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Awaiting Verification
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#617989] dark:text-gray-400 mb-2">
                                            Tenant: {payment.user?.name} ({payment.user?.email})
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-[#617989] dark:text-gray-400">Booking:</span>
                                                <span className="ml-2 text-[#111518] dark:text-white">
                                                    {formatDate(payment.booking?.check_in)} - {formatDate(payment.booking?.check_out)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#617989] dark:text-gray-400">Amount:</span>
                                                <span className="ml-2 font-bold text-[#111518] dark:text-white">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#617989] dark:text-gray-400">Payment ID:</span>
                                                <span className="ml-2 text-[#111518] dark:text-white font-mono text-xs">
                                                    {payment.id}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#617989] dark:text-gray-400">Submitted:</span>
                                                <span className="ml-2 text-[#111518] dark:text-white">
                                                    {formatDate(payment.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setShowQRModal(true);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                                        >
                                            View QR Code
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <button
                                        onClick={() => handleVerifyPayment(payment.id)}
                                        disabled={verifyingPayment}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {verifyingPayment ? (
                                            <span className="flex items-center justify-center">
                                                <span className="animate-spin mr-2">⏳</span>
                                                Verifying...
                                            </span>
                                        ) : (
                                            '✅ Verify Payment'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedPayment(payment);
                                            setRejectionNote('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                    >
                                        ❌ Reject Payment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* QR Code Modal */}
                {showQRModal && selectedPayment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Payment QR Code
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
                                    upiId={selectedPayment.user?.email || 'default@upi'}
                                    amount={selectedPayment.amount / 100}
                                    note={`StayEasy Payment - ${selectedPayment.id}`}
                                />
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <p><strong>Property:</strong> {selectedPayment.booking?.property?.name}</p>
                                <p><strong>Amount:</strong> {formatCurrency(selectedPayment.amount)}</p>
                                <p><strong>Booking:</strong> {formatDate(selectedPayment.booking?.check_in)} - {formatDate(selectedPayment.booking?.check_out)}</p>
                                <p><strong>Payment ID:</strong> {selectedPayment.id}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleConfirmPayment(selectedPayment.id)}
                                    disabled={confirmingPayment}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {confirmingPayment ? (
                                        <span className="flex items-center justify-center">
                                            <span className="animate-spin mr-2">⏳</span>
                                            Confirming...
                                        </span>
                                    ) : (
                                        '✅ I have made the payment'
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Modal */}
                {selectedPayment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Reject Payment
                                </h3>
                                <button
                                    onClick={() => setSelectedPayment(null)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={rejectionNote}
                                    onChange={(e) => setRejectionNote(e.target.value)}
                                    placeholder="Please provide a reason for rejecting this payment..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleRejectPayment(selectedPayment.id)}
                                    disabled={rejectingPayment}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {rejectingPayment ? (
                                        <span className="flex items-center justify-center">
                                            <span className="animate-spin mr-2">⏳</span>
                                            Rejecting...
                                        </span>
                                    ) : (
                                        '❌ Reject Payment'
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedPayment(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentVerificationPage;