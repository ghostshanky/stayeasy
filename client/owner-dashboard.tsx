import React, { useState, useEffect } from 'react';

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  upiReference: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    property: {
      name: string;
      address: string;
    };
  };
}

interface OwnerDashboardProps {
  ownerId: string;
}

export function OwnerDashboard({ ownerId }: OwnerDashboardProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingPayments = async () => {
    try {
      setRefreshing(true);
      // Mock data for now since we don't have the actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock payments data
      const mockPayments: Payment[] = [
        {
          id: '1',
          bookingId: 'booking1',
          amount: 1500000, // ₹15,000 in paise
          currency: 'INR',
          upiReference: 'UPI1234567890',
          status: 'AWAITING_OWNER_VERIFICATION',
          createdAt: new Date().toISOString(),
          user: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          booking: {
            id: 'booking1',
            checkIn: new Date(Date.now() + 86400000 * 7).toISOString(),
            checkOut: new Date(Date.now() + 86400000 * 14).toISOString(),
            property: {
              name: 'Modern Downtown Hostel',
              address: 'Andheri West, Mumbai'
            }
          }
        }
      ];
      
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyPayment = async (paymentId: string) => {
    setActionLoading(paymentId);
    try {
      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from local state
      setPayments(payments.filter(p => p.id !== paymentId));
      
      alert('Payment verified successfully!');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionReason.trim()) return;

    setActionLoading(selectedPayment.id);
    try {
      // Mock rejection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from local state
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      setSelectedPayment(null);
      setRejectionReason('');
      
      alert('Payment rejected successfully!');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusText = status.replace(/_/g, ' ');
    let className = 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full';
    
    switch (status) {
      case 'AWAITING_PAYMENT':
        className += ' bg-yellow-100 text-yellow-800';
        break;
      case 'AWAITING_OWNER_VERIFICATION':
        className += ' bg-blue-100 text-blue-800';
        break;
      case 'VERIFIED':
        className += ' bg-green-100 text-green-800';
        break;
      case 'REJECTED':
        className += ' bg-red-100 text-red-800';
        break;
      case 'CANCELLED':
        className += ' bg-gray-100 text-gray-800';
        break;
      default:
        className += ' bg-gray-100 text-gray-800';
    }

    return <span className={className}>{statusText}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Payment Verification Dashboard</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Review and verify tenant payments for your properties
          </p>
        </div>
        <button
          onClick={fetchPendingPayments}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-green-500 text-4xl mb-4">check_circle</span>
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">All Caught Up!</h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            No pending payments to review at the moment.
            <br />
            New payments will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                    {payment.booking.property.name}
                  </h3>
                  {getStatusBadge(payment.status)}
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  {payment.booking.property.address}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Tenant</div>
                    <div className="font-medium text-text-light-primary dark:text-text-dark-primary">{payment.user.name}</div>
                    <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{payment.user.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Booking Dates</div>
                    <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {formatDate(payment.booking.checkIn)} - {formatDate(payment.booking.checkOut)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Amount</div>
                    <div className="font-medium text-lg text-text-light-primary dark:text-text-dark-primary">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">UPI Reference</div>
                    <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {payment.upiReference || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Created: {formatDate(payment.createdAt)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                      onClick={() => {
                        // In a real app, this would open a modal with payment details
                        alert(`Payment ID: ${payment.id}\nStatus: ${payment.status}`);
                      }}
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      View Details
                    </button>

                    <button
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      disabled={actionLoading === payment.id}
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this payment?')) {
                          setSelectedPayment(payment);
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            setRejectionReason(reason);
                            // In a real app, we would show a proper modal, but for now we'll simulate it
                            handleRejectPayment();
                          }
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      Reject
                    </button>

                    <button
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      disabled={actionLoading === payment.id}
                      onClick={() => handleVerifyPayment(payment.id)}
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {actionLoading === payment.id ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
        Auto-refreshing every 30 seconds • {payments.length} pending payment{payments.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default OwnerDashboard;