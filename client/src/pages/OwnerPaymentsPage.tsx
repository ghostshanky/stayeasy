import { useState } from 'react';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerPaymentsList from '../components/owner/OwnerPaymentsList';
import { useOwnerPayments } from '../hooks/useOwnerPayments';

const OwnerPaymentsPage = () => {
  const { items: payments, loading, error } = useOwnerPayments("");
  const [activeTab, setActiveTab] = useState('all');

  const filterPayments = (payments: any[], status?: string) => {
    if (status === 'all') return payments;
    return payments.filter(payment => payment.status === status.toUpperCase());
  };

  const getPaymentStats = () => {
    const total = payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    const completed = payments.filter((p: any) => p.status === 'COMPLETED' || p.status === 'VERIFIED').length;
    const pending = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'AWAITING_PAYMENT').length;
    const failed = payments.filter((p: any) => p.status === 'FAILED' || p.status === 'REJECTED').length;

    return {
      total,
      completed,
      pending,
      failed
    };
  };

  const stats = getPaymentStats();

  if (loading) {
    return (
      <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
        <OwnerSideNavBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            <div className="text-center py-10">Loading Payments...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Payments</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">Manage payments for your properties</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.total.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">payments</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">schedule</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              All Payments
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'completed' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'failed' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Failed
            </button>
          </div>

          {/* Payments List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {error ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <p className="text-red-500">Error loading payments: {error}</p>
              </div>
            ) : (
              <>
                {filterPayments(payments, activeTab).length > 0 ? (
                  <OwnerPaymentsList payments={filterPayments(payments, activeTab)} />
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">receipt_long</span>
                    <p className="text-gray-500 dark:text-gray-400">
                      {activeTab === 'all' ? 'No payments found' : `No ${activeTab} payments found`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerPaymentsPage;