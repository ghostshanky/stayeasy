import React, { useState } from 'react';
import { useOwnerPayments } from '../../client/src/hooks/useOwnerPayments';
import { supabase } from '../../client/src/lib/supabase';

interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  owner_id: string;
  amount: number;
  currency: string;
  status: 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';
  upi_reference?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  booking: {
    check_in: string;
    check_out: string;
    property: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return 'bg-yellow-100 text-yellow-800';
    case 'AWAITING_OWNER_VERIFICATION':
      return 'bg-blue-100 text-blue-800';
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return `₹${(amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const OwnerPaymentsList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { items: payments, loading, error } = useOwnerPayments(10, 1, statusFilter);

  const handleVerifyPayment = async (paymentId: string, verified: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('payments')
        .update({ 
          status: verified ? 'VERIFIED' : 'REJECTED',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      // Refresh the payments list
      window.location.reload();
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading payments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Payments</h2>
        <div className="flex gap-2">
          <div className="w-full md:w-48">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="">All Statuses</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="AWAITING_OWNER_VERIFICATION">Awaiting Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-text-light-secondary dark:text-text-dark-secondary mb-4">
            payments
          </span>
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            No payments found
          </h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            {statusFilter ? `No ${statusFilter.toLowerCase().replace(/_/g, ' ')} payments at the moment.` : 'No payments have been made for your properties yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase bg-background-light dark:bg-background-dark">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Property</th>
                <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dates</th>
                <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">UPI Reference</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className="border-b border-border-light dark:border-border-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50"
                >
                  <td className="px-4 py-3 font-medium text-text-light-primary dark:text-text-dark-primary">
                    <div className="font-bold">{payment.booking.property.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.user.name}</div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {payment.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatDate(payment.booking.check_in)}</div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      to {formatDate(payment.booking.check_out)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(payment.status)}`}>
                      {payment.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {payment.upi_reference || 'Not provided'}
                  </td>
                  <td className="px-4 py-3">
                    {payment.status === 'AWAITING_OWNER_VERIFICATION' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyPayment(payment.id, false)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(payment.id, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerPaymentsList;