import React, { useState, useEffect } from 'react';
import { Page, Booking, StatChangeDirection } from '../types';
import SideNavBar from '../components/SideNavBar';
import { useNavigate } from 'react-router-dom';
import { DashboardCardSkeleton } from '../components/common';
import toast from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { BRAND } from '../config/brand';

interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeDirection?: StatChangeDirection;
  icon: string;
  color: string;
}

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState('User');
  const { items: bookings, loading, error } = useBookings(user?.id || '', 10, 1);

  useEffect(() => {
    if (user) {
      setUserName(user.name || user.email?.split('@')[0] || 'User');
    }
  }, [user]);

  const handlePayment = async (bookingId: string) => {
    try {
      // Create payment intent first
      const response = await apiClient.post('/payments/create', { bookingId });
      if (response.data.success) {
        navigate('/confirm', {
          state: {
            paymentId: response.data.data.paymentId,
            upiUri: response.data.data.upiUri,
            qrDataUrl: response.data.data.qrDataUrl,
            amount: response.data.data.amount
          }
        });
      }
    } catch (error) {
      console.error('Error navigating to payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
  };

  const handleChat = async (propertyId: string, ownerId: string) => {
    try {
      navigate('/messages');
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_VERIFICATION': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AWAITING_VERIFICATION': return 'Verifying...';
      default: return status;
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

  const getTotalSpent = () => {
    return bookings
      .filter(booking => booking.status === 'COMPLETED' || booking.status === 'CONFIRMED')
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
    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex gap-4">
        <img
          src={booking.properties?.images?.[0] || BRAND.defaultAvatar}
          alt={booking.properties?.title}
          className="w-24 h-24 rounded-lg object-cover"
        />
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
              {getStatusLabel(booking.status)}
            </span>

            <div className="flex gap-2">
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleChat(booking.properties?.id || '', booking.owner_id || '')}
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                  title="Message Owner"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                </button>
              )}
              {booking.status === 'PENDING' && (
                <button
                  onClick={() => handlePayment(booking.id)}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
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
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your stays today
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          // Show skeleton loaders for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <DashboardCardSkeleton key={index} />
          ))
        ) : error ? (
          <div className="col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
            <p className="text-red-500 dark:text-red-400">Failed to load bookings: {error}</p>
          </div>
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          bookings.map(renderBookingCard)
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;