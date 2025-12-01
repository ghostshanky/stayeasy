import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { useNavigate } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import { usePayments } from '../hooks/usePayments';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PaymentCardProps {
  payment: any;
  navigate: (page: Page) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment, navigate }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'VERIFIED': {
        className: 'bg-green-100 text-green-800',
        text: 'Paid',
        icon: 'check_circle'
      },
      'AWAITING_PAYMENT': {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Pending',
        icon: 'schedule'
      },
      'AWAITING_OWNER_VERIFICATION': {
        className: 'bg-blue-100 text-blue-800',
        text: 'Under Verification',
        icon: 'hourglass_top'
      },
      'REJECTED': {
        className: 'bg-red-100 text-red-800',
        text: 'Rejected',
        icon: 'cancel'
      },
      'REFUNDED': {
        className: 'bg-gray-100 text-gray-800',
        text: 'Refunded',
        icon: 'money_off'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800',
      text: status,
      icon: 'help'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <span className="material-symbols-outlined text-sm">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReceipt = async () => {
    try {
      // Generate receipt PDF or download existing receipt
      const response = await fetch(`/api/payments/${payment.id}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${payment.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handlePayNow = () => {
    navigate('confirmAndPay');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return 'account_balance';
      case 'CREDIT_CARD': return 'credit_card';
      case 'DEBIT_CARD': return 'credit_card';
      case 'BANK_TRANSFER': return 'account_balance';
      default: return 'payments';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {payment.booking?.property?.name || 'Unknown Property'}
            </h3>
            {getStatusBadge(payment.status)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Payment ID: {payment.id}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Created: {formatDateTime(payment.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(payment.amount)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payment.booking?.property?.price ? `${payment.booking.property.price}/night` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-gray-400">calendar_today</span>
            <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(payment.booking?.check_in)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-gray-400">calendar_today</span>
            <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(payment.booking?.check_out)}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-gray-400">home</span>
            <span className="text-gray-600 dark:text-gray-400">Location:</span>
            <span className="text-gray-900 dark:text-white">
              {payment.booking?.property?.location || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-gray-400">payments</span>
            <span className="text-gray-600 dark:text-gray-400">Method:</span>
            <span className="text-gray-900 dark:text-white">
              {payment.payment_method || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {payment.upi_reference && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-blue-600">receipt_long</span>
            <span className="text-blue-800 dark:text-blue-300 font-medium">UPI Reference:</span>
            <span className="text-blue-900 dark:text-blue-100 font-mono text-sm">
              {payment.upi_reference}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {payment.status === 'VERIFIED' && (
          <>
            <button
              onClick={downloadReceipt}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">download</span>
              Download Receipt
            </button>
            <button
              onClick={() => navigate('propertyDetails')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">visibility</span>
              View Property
            </button>
          </>
        )}

        {payment.status === 'AWAITING_PAYMENT' && (
          <button
            onClick={handlePayNow}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">payments</span>
            Pay Now
          </button>
        )}

        {payment.status === 'AWAITING_OWNER_VERIFICATION' && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">hourglass_top</span>
            Payment Confirmed
          </button>
        )}

        {payment.status === 'REJECTED' && (
          <button
            onClick={handlePayNow}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Retry Payment
          </button>
        )}

        {payment.status === 'REFUNDED' && (
          <button
            onClick={downloadReceipt}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">download</span>
            Download Refund Receipt
          </button>
        )}

        <button
          onClick={() => navigate('bookings')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">event</span>
          View Booking
        </button>
      </div>
    </div>
  );
};

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history');
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    totalBookings: 0,
    upcomingPayments: 0
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { items: payments, loading, error } = usePayments(userId || '', 10, 1, activeTab === 'history' ? undefined : 'AWAITING_PAYMENT');

  useEffect(() => {
    if (payments.length > 0) {
      const totalPaid = payments
        .filter(p => p.status === 'VERIFIED')
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingAmount = payments
        .filter(p => p.status === 'AWAITING_PAYMENT')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalBookings = new Set(payments.map(p => p.booking_id)).size;

      const upcomingPayments = payments.filter(p =>
        p.status === 'AWAITING_PAYMENT' &&
        p.booking?.check_in > new Date().toISOString()
      ).length;

      setStats({
        totalPaid,
        pendingAmount,
        totalBookings,
        upcomingPayments
      });
    }
  }, [payments]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getPaymentsByStatus = (status: string) => {
    return payments.filter(payment => payment.status === status);
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
                  <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Payments</p>
                  <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Manage your payments and view receipts</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                ))}
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
                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Payments</p>
                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Manage your payments and view receipts</p>
              </div>
            </div>

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-green-600">paid</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.pendingAmount)}
                    </p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-yellow-600">schedule</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalBookings}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-blue-600">event</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.upcomingPayments}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-purple-600">upcoming</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
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
              <button
                onClick={() => setActiveTab('verified')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'verified' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveTab('refunded')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'refunded' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Refunded
              </button>
            </div>

            {/* Payments Content */}
            <div className="space-y-4">
              {activeTab === 'history' && (
                payments.length > 0 ? (
                  payments.map(payment => (
                    <PaymentCard key={payment.id} payment={payment} navigate={navigate} />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">receipt_long</span>
                    <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
                  </div>
                )
              )}

              {activeTab === 'pending' && (
                getPaymentsByStatus('AWAITING_PAYMENT').length > 0 ? (
                  getPaymentsByStatus('AWAITING_PAYMENT').map(payment => (
                    <PaymentCard key={payment.id} payment={payment} navigate={navigate} />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">schedule</span>
                    <p className="text-gray-500 dark:text-gray-400">No pending payments</p>
                  </div>
                )
              )}

              {activeTab === 'verified' && (
                getPaymentsByStatus('VERIFIED').length > 0 ? (
                  getPaymentsByStatus('VERIFIED').map(payment => (
                    <PaymentCard key={payment.id} payment={payment} navigate={navigate} />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">check_circle</span>
                    <p className="text-gray-500 dark:text-gray-400">No completed payments</p>
                  </div>
                )
              )}

              {activeTab === 'refunded' && (
                getPaymentsByStatus('REFUNDED').length > 0 ? (
                  getPaymentsByStatus('REFUNDED').map(payment => (
                    <PaymentCard key={payment.id} payment={payment} navigate={navigate} />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">money_off</span>
                    <p className="text-gray-500 dark:text-gray-400">No refunded payments</p>
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentsPage;
