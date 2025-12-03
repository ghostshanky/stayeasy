import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  property_id: string;
  property_name: string;
  tenant_name: string;
  check_in: string;
  check_out: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  total_amount: number;
  created_at: string;
}

interface OwnerBookingsListProps {
  onBookingAction: (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => void;
}

const OwnerBookingsList: React.FC<OwnerBookingsListProps> = ({ onBookingAction }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      const response = await fetch(`/api/owner/bookings?userId=${userId}&status=${filterStatus}`, {
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">All Bookings</h2>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Property</th>
                <th scope="col" className="px-6 py-3">Tenant</th>
                <th scope="col" className="px-6 py-3">Dates</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Amount</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {booking.property_name}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {booking.tenant_name}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <div>
                      <div>{new Date(booking.check_in).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        to {new Date(booking.check_out).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    ₹{booking.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {getActionButtons(booking)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsList;