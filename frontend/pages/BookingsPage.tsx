import React, { useState, useEffect } from 'react';
import { Page, Booking } from '../types';
import { useNavigate } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import { supabase } from '../client/src/lib/supabase';

interface BookingCardProps {
  booking: Booking;
  navigate: (page: Page) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, navigate }) => {
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
                  <span className="material-symbols-outlined text-sm">access_time</span>
                  Check-in: {formatTime(booking.check_in)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm">
                  <span className="text-gray-500">Booking ID: </span>
                  <span className="font-medium text-gray-800 dark:text-white">BK{booking.id.slice(-8)}</span>
                </div>
                
                <div className="flex gap-2">
                  {booking.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => navigate('messages')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        Chat
                      </button>
                      <button
                        onClick={() => navigate('propertyDetails')}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Details
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => navigate('confirmAndPay')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      Pay Now
                    </button>
                  )}
                  
                  {booking.status === 'COMPLETED' && (
                    <>
                      <button
                        onClick={() => navigate('propertyDetails')}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Details
                      </button>
                      <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                        <span className="material-symbols-outlined text-sm">star</span>
                        Review
                      </button>
                    </>
                  )}
                  
                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingsPage = () => {
    const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchBookings();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
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
              images,
              price
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
      <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <div className="flex h-full grow">
          <SideNavBar onNavigate={navigate} />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap justify-between gap-3 mb-6">
                <div className="flex min-w-72 flex-col gap-2">
                  <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">My Bookings</p>
                  <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Manage your stay reservations</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="flex h-full grow">
        <SideNavBar onNavigate={navigate} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between gap-3 mb-6">
              <div className="flex min-w-72 flex-col gap-2">
                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">My Bookings</p>
                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Manage your stay reservations</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Upcoming Stays
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'current' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Current Stay
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'past' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Past Stays
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'cancelled' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Cancelled
              </button>
            </div>

            {/* Bookings Content */}
            <div className="space-y-6">
              {activeTab === 'upcoming' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Upcoming Stays ({getUpcomingBookings().length})
                    </h2>
                  </div>
                  {getUpcomingBookings().length > 0 ? (
                    <div className="space-y-4">
                      {getUpcomingBookings().map(booking => (
                        <BookingCard key={booking.id} booking={booking} navigate={navigate} />
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Current Stay ({getCurrentBookings().length})
                    </h2>
                  </div>
                  {getCurrentBookings().length > 0 ? (
                    <div className="space-y-4">
                      {getCurrentBookings().map(booking => (
                        <BookingCard key={booking.id} booking={booking} navigate={navigate} />
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Past Stays ({getPastBookings().length})
                    </h2>
                  </div>
                  {getPastBookings().length > 0 ? (
                    <div className="space-y-4">
                      {getPastBookings().map(booking => (
                        <BookingCard key={booking.id} booking={booking} navigate={navigate} />
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

              {activeTab === 'cancelled' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Cancelled Bookings ({getBookingsByStatus('CANCELLED').length})
                    </h2>
                  </div>
                  {getBookingsByStatus('CANCELLED').length > 0 ? (
                    <div className="space-y-4">
                      {getBookingsByStatus('CANCELLED').map(booking => (
                        <BookingCard key={booking.id} booking={booking} navigate={navigate} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">cancel</span>
                      <p className="text-gray-500 dark:text-gray-400">No cancelled bookings</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookingsPage;
