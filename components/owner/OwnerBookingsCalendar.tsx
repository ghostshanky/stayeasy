import React, { useState, useEffect } from 'react';
import { supabase } from '../../client/src/lib/supabase';

interface Booking {
  id: string;
  property_id: string;
  property_name: string;
  tenant_name: string;
  check_in: string;
  check_out: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  total_amount: number;
}

interface OwnerBookingsCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onBookingAction: (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => void;
}

const OwnerBookingsCalendar: React.FC<OwnerBookingsCalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  onBookingAction 
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      const response = await fetch(`/api/owner/bookings?userId=${userId}&date=${selectedDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButtons = (booking: Booking) => {
    switch (booking.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onBookingAction(booking.id, 'confirm')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onBookingAction(booking.id, 'cancel')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <button
            onClick={() => onBookingAction(booking.id, 'complete')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Mark Complete
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Bookings for {selectedDate.toLocaleDateString()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              onDateSelect(newDate);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-medium min-w-[120px] text-center">
            {selectedDate.toLocaleDateString()}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              onDateSelect(newDate);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>No bookings for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {booking.property_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Tenant: {booking.tenant_name}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Check-in: {new Date(booking.check_in).toLocaleDateString()}
                    </span>
                    <span>
                      Check-out: {new Date(booking.check_out).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{booking.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {getActionButtons(booking)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsCalendar;