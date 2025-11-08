import React from 'react';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerPaymentsList from '../components/owner/OwnerPaymentsList';

interface OwnerPaymentsPageProps {
  navigate: (page: string) => void;
}

const OwnerPaymentsPage: React.FC<OwnerPaymentsPageProps> = ({ navigate }) => {
  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={navigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Payments</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Manage and verify payments for your properties
            </p>
          </div>
          
          <OwnerPaymentsList />
        </div>
      </main>
    </div>
  );
};

export default OwnerPaymentsPage;