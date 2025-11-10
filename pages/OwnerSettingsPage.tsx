import React from 'react';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerProfileSettings from '../components/owner/OwnerProfileSettings';

interface OwnerSettingsPageProps {
  navigate: (page: string) => void;
}

const OwnerSettingsPage: React.FC<OwnerSettingsPageProps> = ({ navigate }) => {
  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={navigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Settings</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Manage your profile and payment settings
            </p>
          </div>
          
          <OwnerProfileSettings />
        </div>
      </main>
    </div>
  );
};

export default OwnerSettingsPage;