import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerPaymentsList from '../components/owner/OwnerPaymentsList';
import { useNavigate } from 'react-router-dom';

const OwnerPaymentsPage = ({ navigate: pageNavigate }: { navigate: (page: Page) => void }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      const response = await fetch(`/api/payments/owner?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId: string, action: 'verify' | 'reject') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/payments/${paymentId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh payments
        fetchPayments();
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    }
  };

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={pageNavigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payment Management</h2>
              <div className="flex items-center gap-4">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Verified</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : (
              <OwnerPaymentsList 
                payments={payments}
                onPaymentAction={handlePaymentAction}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerPaymentsPage;