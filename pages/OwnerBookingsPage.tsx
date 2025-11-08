import React, { useState } from 'react';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerBookingsList from '../components/owner/OwnerBookingsList';
import OwnerBookingsCalendar from '../components/owner/OwnerBookingsCalendar';

interface OwnerBookingsPageProps {
  navigate: (page: string) => void;
}

const OwnerBookingsPage: React.FC<OwnerBookingsPageProps> = ({ navigate }) => {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={navigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Bookings</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-background-light dark:hover:bg-background-dark'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'calendar'
                    ? 'bg-primary text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-background-light dark:hover:bg-background-dark'
                }`}
              >
                Calendar View
              </button>
            </div>
          </div>
          
          {activeView === 'list' ? <OwnerBookingsList /> : <OwnerBookingsCalendar />}
        </div>
      </main>
    </div>
  );
};

export default OwnerBookingsPage;