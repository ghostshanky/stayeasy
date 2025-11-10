import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerBookingsCalendar from '../components/owner/OwnerBookingsCalendar';
import OwnerBookingsList from '../components/owner/OwnerBookingsList';
import { useNavigate } from 'react-router-dom';

const OwnerBookingsPage = ({ navigate: pageNavigate }: { navigate: (page: Page) => void }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/bookings/${bookingId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh bookings
        window.location.reload();
      } else {
        throw new Error('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={pageNavigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'calendar' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'list' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              List View
            </button>
          </div>
          
          {activeTab === 'calendar' ? (
            <OwnerBookingsCalendar 
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onBookingAction={handleBookingAction}
            />
          ) : (
            <OwnerBookingsList 
              onBookingAction={handleBookingAction}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default OwnerBookingsPage;