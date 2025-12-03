import React, { useState } from 'react';
import { verifyPayment } from '../../hooks/usePayments';
import toast from 'react-hot-toast';

interface OwnerPaymentsListProps {
    payments: any[];
}

const OwnerPaymentsList: React.FC<OwnerPaymentsListProps> = ({ payments }) => {
    const [verifying, setVerifying] = useState<string | null>(null);
    
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
            'COMPLETED': { className: 'bg-green-100 text-green-800', text: 'Completed' },
            'AWAITING_PAYMENT': { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            'PENDING': { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            'AWAITING_OWNER_VERIFICATION': { className: 'bg-blue-100 text-blue-800', text: 'Under Verification' },
            'REJECTED': { className: 'bg-red-100 text-red-800', text: 'Rejected' },
            'FAILED': { className: 'bg-red-100 text-red-800', text: 'Failed' },
            'REFUNDED': { className: 'bg-gray-100 text-gray-800', text: 'Refunded' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { className: 'bg-gray-100 text-gray-800', text: status };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.text}
            </span>
        );
    };

    const handleVerifyPayment = async (paymentId: string, verified: boolean) => {
        setVerifying(paymentId);
        try {
            const response = await verifyPayment(paymentId, verified);
            if (response.success) {
                toast.success(`Payment ${verified ? 'verified' : 'rejected'} successfully!`);
                // Refresh the page to update the payment status
                window.location.reload();
            } else {
                toast.error(response.error?.message || 'Failed to verify payment');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Failed to verify payment');
        } finally {
            setVerifying(null);
        }
    };

    return (
        <div className="space-y-4">
            {payments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No payments found</p>
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
                                Booking: {payment.booking ? `${formatDate(payment.booking.check_in)} - ${formatDate(payment.booking.check_out)}` : 'N/A'}
                            </span>
                            <span>
                                {payment.upi_reference && `UPI Reference: ${payment.upi_reference}`}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {(payment.status === 'VERIFIED' || payment.status === 'COMPLETED') && (
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVerifyPayment(payment.id, true)}
                                        disabled={verifying === payment.id}
                                        className="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50"
                                    >
                                        {verifying === payment.id ? 'Verifying...' : 'Verify'}
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(payment.id, false)}
                                        disabled={verifying === payment.id}
                                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                                    >
                                        {verifying === payment.id ? 'Verifying...' : 'Reject'}
                                    </button>
                                </div>
                            )}
                            <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                View Details
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default OwnerPaymentsList;