import React, { useState, useEffect } from 'react';
import { Page, Booking } from '../types';
import SideNavBar from '../components/SideNavBar';
import Header from '../components/Header';
import { supabase } from '../client/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

const TenantDashboard = ({ navigate: pageNavigate }: { navigate: (page: Page) => void }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'messages'

  useEffect(() => {
    fetchUserData();
    fetchBookings();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            properties (
              id,
              title,
              location,
              images
            )
          `)
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (bookingId: string) => {
    try {
      // Navigate to payment page
      navigate('confirmAndPay');
    } catch (error) {
      console.error('Error navigating to payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleChat = async (propertyId: string, ownerId: string) => {
    try {
      // Navigate to messages page
      navigate('messages');
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings.filter(booking => new Date(booking.check_in) > now);
  };

  const getCurrentBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return checkIn <= now && checkOut >= now;
    });
  };

  const getPastBookings = () => {
    const now = new Date();
    return bookings.filter(booking => new Date(booking.check_out) < now);
  };

  const renderBookingCard = (booking: Booking) => (
    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img
            src={booking.properties?.images?.[0] || 'https://via.placeholder.com/100x100?text=No+Image'}
            alt={booking.properties?.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {booking.properties?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {booking.properties?.location}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Check-in: {new Date(booking.check_in).toLocaleDateString()}
            </span>
            <span>
              Check-out: {new Date(booking.check_out).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
            
            <div className="flex gap-2">
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleChat(booking.properties?.id || '', booking.owner_id || '')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Chat Owner
                </button>
              )}
              
              {booking.status === 'PENDING' && (
                <button
                  onClick={() => handlePayment(booking.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <SideNavBar onNavigate={pageNavigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <Header userName={userName} />
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'bookings' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Messages
            </button>
          </div>
          
          {activeTab === 'bookings' ? (
            <div className="space-y-6">
              {/* Upcoming Bookings */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Upcoming Stays</h2>
                {getUpcomingBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getUpcomingBookings().map(renderBookingCard)}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
                  </div>
                )}
              </div>

              {/* Current Bookings */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Current Stay</h2>
                {getCurrentBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getCurrentBookings().map(renderBookingCard)}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No active bookings</p>
                  </div>
                )}
              </div>

              {/* Past Bookings */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Past Stays</h2>
                {getPastBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getPastBookings().map(renderBookingCard)}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No past bookings</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <p>Messages interface would be implemented here</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TenantDashboard;