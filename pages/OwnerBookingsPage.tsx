import React, { useState, useEffect } from 'react';
import { Page, Booking } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import { supabase } from '../client/src/lib/supabase';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'check_circle';
      case 'PENDING': return 'schedule';
      case 'CANCELLED': return 'cancel';
      case 'COMPLETED': return 'task_alt';
      default: return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysCount = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isUpcoming = (checkIn: string) => {
    return new Date(checkIn) > new Date();
  };

  const isCurrent = (checkIn: string, checkOut: string) => {
    const now = new Date();
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return start <= now && end >= now;
  };

  const daysCount = getDaysCount(booking.check_in, booking.check_out);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img
            src={booking.properties?.images?.[0] || 'https://via.placeholder.com/100x100?text=No+Image'}
            alt={booking.properties?.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  <span className="material-symbols-outlined text-sm">{getStatusIcon(booking.status)}</span>
                  {booking.status}
                </span>
                {isUpcoming(booking.check_in) && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="material-symbols-outlined text-sm">event_upcoming</span>
                    Upcoming
                  </span>
                )}
                {isCurrent(booking.check_in, booking.check_out) && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <span className="material-symbols-outlined text-sm">today</span>
                    Current
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {booking.properties?.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {booking.properties?.location}
              </p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                </span>
                <span>
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {daysCount} {daysCount === 1 ? 'day' : 'days'}
                </span>
                <span>
                  <span className="material-symbols-outlined text-sm">payments</span>
                  ₹{(booking as any).total_amount?.toLocaleString() || '0'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm">
                  <span className="text-gray-500">Booking ID: </span>
                  <span className="font-medium text-gray-800 dark:text-white">BK{booking.id.slice(-8)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Tenant: </span>
                  <span className="font-medium text-gray-800 dark:text-white">{(booking as any).tenant?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerBookingsPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get all properties owned by this user
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        if (propertiesError) {
          throw propertiesError;
        }

        const propertyIds = properties?.map((p: any) => p.id) || [];

        // Get all bookings for these properties
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            properties (
              id,
              title,
              location,
              images
            ),
            tenant (
              id,
              name,
              email
            )
          `)
          .in('property_id', propertyIds)
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

  const getBookingsByStatus = (status: string) => {
    return bookings.filter(booking => booking.status === status);
  };

  if (loading) {
    return (
      <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
        <OwnerSideNavBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            <div className="text-center py-10">Loading Bookings...</div>
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
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Bookings</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">Manage bookings for your properties</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Upcoming ({getUpcomingBookings().length})
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'current' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Current ({getCurrentBookings().length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'past' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Past ({getPastBookings().length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'confirmed' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Confirmed ({getBookingsByStatus('CONFIRMED').length})
            </button>
          </div>

          {/* Bookings Content */}
          <div className="space-y-6">
            {activeTab === 'upcoming' && (
              <div>
                {getUpcomingBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getUpcomingBookings().map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event_upcoming</span>
                    <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'current' && (
              <div>
                {getCurrentBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getCurrentBookings().map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">today</span>
                    <p className="text-gray-500 dark:text-gray-400">No active bookings</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div>
                {getPastBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getPastBookings().map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">history</span>
                    <p className="text-gray-500 dark:text-gray-400">No past bookings</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'confirmed' && (
              <div>
                {getBookingsByStatus('CONFIRMED').length > 0 ? (
                  <div className="space-y-4">
                    {getBookingsByStatus('CONFIRMED').map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">check_circle</span>
                    <p className="text-gray-500 dark:text-gray-400">No confirmed bookings</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerBookingsPage;