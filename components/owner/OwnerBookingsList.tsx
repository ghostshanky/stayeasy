import React, { useState } from 'react';
import { useOwnerBookings } from '../../client/src/hooks/useOwnerBookings';

interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  property: {
    name: string;
    address: string;
  };
  user: {
    name: string;
    email: string;
  };
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const OwnerBookingsList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { items: bookings, loading, error } = useOwnerBookings(10, 1, statusFilter);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Bookings</h2>
        <div className="flex gap-2">
          <div className="w-full md:w-48">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-text-light-secondary dark:text-text-dark-secondary mb-4">
            event_busy
          </span>
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            No bookings found
          </h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            {statusFilter ? `No ${statusFilter.toLowerCase()} bookings at the moment.` : 'No bookings have been made for your properties yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase bg-background-light dark:bg-background-dark">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Property</th>
                <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dates</th>
                <th scope="col" className="px-4 py-3 font-semibold">Guests</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="border-b border-border-light dark:border-border-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50"
                >
                  <td className="px-4 py-3 font-medium text-text-light-primary dark:text-text-dark-primary">
                    <div className="font-bold">{booking.property.name}</div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {booking.property.address}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{booking.user.name}</div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {booking.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatDate(booking.check_in)}</div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      to {formatDate(booking.check_out)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{booking.guests}</td>
                  <td className="px-4 py-3 font-medium">₹{booking.total_price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
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