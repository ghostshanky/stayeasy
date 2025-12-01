import React, { useState, useEffect } from 'react';
import { Page, Booking } from '../types';
import SideNavBar from '../components/SideNavBar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { DashboardCardSkeleton } from '../components/common';

interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeDirection?: 'increase' | 'decrease';
  icon: string;
  color: string;
}

const TenantDashboard = () => {
    const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  interface UserProfile {
    full_name?: string;
  }

  useEffect(() => {
    fetchUserData();
    fetchBookings();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch user profile from the database to get the actual name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Fallback to email-based name if profile not found
          setUserName(user.email?.split('@')[0] || 'User');
        } else {
          setUserName((profile as any)?.full_name || user.email?.split('@')[0] || 'User');
        }
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
              images,
              price
            )
          `)
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Database connection failed, using sample bookings:', error.message);
          // Use sample bookings for development/testing
          const sampleBookings: Booking[] = [
            {
              id: crypto.randomUUID(),
              tenant_id: user.id,
              owner_id: crypto.randomUUID(),
              property_id: crypto.randomUUID(),
              check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              check_out: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
              status: 'CONFIRMED',
              total_amount: 8500 * 7,
              payment_status: 'COMPLETED' as any,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              properties: {
                id: crypto.randomUUID(),
                title: 'Modern PG near Tech Park',
                location: 'Bangalore, Karnataka',
                images: ['https://via.placeholder.com/400x300?text=Property+1'],
                price: 8500
              }
            },
            {
              id: crypto.randomUUID(),
              tenant_id: user.id,
              owner_id: crypto.randomUUID(),
              property_id: crypto.randomUUID(),
              check_in: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              check_out: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
              status: 'PENDING',
              total_amount: 4500 * 2,
              payment_status: 'PENDING',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              properties: {
                id: crypto.randomUUID(),
                title: 'Cozy Hostel in City Center',
                location: 'Mumbai, Maharashtra',
                images: ['https://via.placeholder.com/400x300?text=Property+2'],
                price: 4500
              }
            },
            {
              id: crypto.randomUUID(),
              tenant_id: user.id,
              owner_id: crypto.randomUUID(),
              property_id: crypto.randomUUID(),
              check_in: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
              check_out: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              status: 'COMPLETED',
              total_amount: 12000 * 5,
              payment_status: 'COMPLETED' as any,
              created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              properties: {
                id: crypto.randomUUID(),
                title: 'Luxury Apartment PG',
                location: 'Delhi NCR',
                images: ['https://via.placeholder.com/400x300?text=Property+3'],
                price: 12000
              }
            }
          ];
          setBookings(sampleBookings);
          return;
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
      navigate('/confirm');
    } catch (error) {
      console.error('Error navigating to payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleChat = async (propertyId: string, ownerId: string) => {
    try {
      navigate('/messages');
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

  const getTotalSpent = () => {
    return bookings
      .filter(booking => booking.status === 'COMPLETED')
      .reduce((total, booking) => {
        const price = booking.properties?.price || 0;
        return total + price;
      }, 0);
  };

  const getQuickActions = () => [
    {
      title: 'Search Properties',
      description: 'Find your perfect stay',
      icon: 'search',
      action: () => navigate('/search')
    },
    {
      title: 'View Bookings',
      description: 'Manage your reservations',
      icon: 'calendar_month',
      action: () => navigate('/bookings')
    },
    {
      title: 'Make Payment',
      description: 'Pay for upcoming stays',
      icon: 'payments',
      action: () => navigate('/payments')
    },
    {
      title: 'Send Message',
      description: 'Chat with property owners',
      icon: 'chat',
      action: () => navigate('/messages')
    }
  ];

  const stats: StatCardData[] = [
    {
      title: 'Total Stays',
      value: bookings.length.toString(),
      icon: 'hotel',
      color: 'text-blue-600'
    },
    {
      title: 'Upcoming',
      value: getUpcomingBookings().length.toString(),
      icon: 'event_upcoming',
      color: 'text-green-600'
    },
    {
      title: 'Current',
      value: getCurrentBookings().length.toString(),
      icon: 'today',
      color: 'text-purple-600'
    },
    {
      title: 'Total Spent',
      value: `₹${getTotalSpent().toLocaleString()}`,
      icon: 'payments',
      color: 'text-orange-600'
    }
  ];

  const renderBookingCard = (booking: Booking) => (
    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img
            src={booking.properties?.images?.[0] || '/default_profile_pic.jpg'}
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
      <SideNavBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your stays today
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Show skeleton loaders for stats cards
              Array.from({ length: 4 }).map((_, index) => (
                <DashboardCardSkeleton key={index} />
              ))
            ) : (
              stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                      <span className="material-symbols-outlined text-2xl" style={{ color: stat.color }}>
                        {stat.icon}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-105 text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      {action.icon}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Stays</h2>
                <button 
                  onClick={() => navigate('/bookings')}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {getUpcomingBookings().length > 0 ? (
                <div className="space-y-4">
                  {getUpcomingBookings().slice(0, 2).map(renderBookingCard)}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event_upcoming</span>
                  <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
                </div>
              )}
            </div>

            {/* Current Bookings */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Stay</h2>
                {getCurrentBookings().length > 0 && (
                  <button
                    onClick={() => navigate('/bookings')}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    View All →
                  </button>
                )}
              </div>
              {loading ? (
                <DashboardCardSkeleton />
              ) : getCurrentBookings().length > 0 ? (
                <div className="space-y-4">
                  {getCurrentBookings().slice(0, 1).map(renderBookingCard)}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">today</span>
                  <p className="text-gray-500 dark:text-gray-400">No active bookings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantDashboard;