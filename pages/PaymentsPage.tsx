import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';
import { usePayments } from '../client/src/hooks/usePayments';
import { supabase } from '../client/src/lib/supabase';

const PaymentsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [activeTab, setActiveTab] = useState('history');
    const [userId, setUserId] = useState<string | null>(null);
    
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        getUser();
    }, []);

    const { items: payments, loading, error } = usePayments(userId || '', 10, 1, activeTab === 'history' ? undefined : 'AWAITING_PAYMENT');

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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'VERIFIED': { className: 'bg-green-100 text-green-800', text: 'Paid' },
            'AWAITING_PAYMENT': { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            'AWAITING_OWNER_VERIFICATION': { className: 'bg-blue-100 text-blue-800', text: 'Under Verification' },
            'REJECTED': { className: 'bg-red-100 text-red-800', text: 'Rejected' },
            'REFUNDED': { className: 'bg-gray-100 text-gray-800', text: 'Refunded' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || { className: 'bg-gray-100 text-gray-800', text: status };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
                <div className="flex h-full grow">
                    <SideNavBar onNavigate={navigate} />
                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-wrap justify-between gap-3 mb-6">
                                <div className="flex min-w-72 flex-col gap-2">
                                    <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Payment History</p>
                                    <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">View and manage your payment records</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
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
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
                <div className="flex h-full grow">
                    <SideNavBar onNavigate={navigate} />
                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center py-8">
                                <p className="text-red-500">Error loading payments: {error}</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <SideNavBar onNavigate={navigate} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Payment History</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">View and manage your payment records</p>
                            </div>
                        </div>

                        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Payment History
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Pending Payments
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {payments.length === 0 ? (
                                <div className="flex flex-col gap-4 rounded-xl p-8 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <div key={payment.id} className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-[#111518] dark:text-white">{payment.booking?.property?.name || 'Unknown Property'}</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Payment ID: {payment.id}</p>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">{formatDate(payment.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#111518] dark:text-white">{formatCurrency(payment.amount)}</p>
                                                {getStatusBadge(payment.status)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                            <span>
                                                Booking: {formatDate(payment.booking?.check_in)} - {formatDate(payment.booking?.check_out)}
                                            </span>
                                            <span>
                                                {payment.upi_reference && `UPI Reference: ${payment.upi_reference}`}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {payment.status === 'VERIFIED' && (
                                                <button className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20">
                                                    Download Receipt
                                                </button>
                                            )}
                                            {payment.status === 'AWAITING_PAYMENT' && (
                                                <button className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
                                                    Pay Now
                                                </button>
                                            )}
                                            {payment.status === 'AWAITING_OWNER_VERIFICATION' && (
                                                <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
                                                    Payment Confirmed
                                                </button>
                                            )}
                                            <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PaymentsPage;
