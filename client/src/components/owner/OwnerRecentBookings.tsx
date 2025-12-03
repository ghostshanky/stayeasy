import React from 'react';
import { Booking } from '../../types';

interface OwnerRecentBookingsProps {
    bookings: Booking[];
}

const OwnerRecentBookings: React.FC<OwnerRecentBookingsProps> = ({ bookings }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (bookings.length === 0) {
        return (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6 text-center text-text-light-secondary dark:text-text-dark-secondary">
                No recent bookings
            </div>
        );
    }

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase bg-background-light dark:bg-background-dark">
                        <tr>
                            <th className="px-6 py-3">Property</th>
                            <th className="px-6 py-3">Tenant</th>
                            <th className="px-6 py-3">Dates</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-border-light dark:border-border-dark last:border-b-0 hover:bg-background-light dark:hover:bg-background-dark transition-colors">
                                <td className="px-6 py-4 font-medium text-text-light-primary dark:text-text-dark-primary">
                                    {booking.properties?.title || 'Unknown Property'}
                                </td>
                                <td className="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                                    {booking.tenant?.name || 'Unknown Tenant'}
                                </td>
                                <td className="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                                    <div className="flex flex-col">
                                        <span>{new Date(booking.check_in).toLocaleDateString()}</span>
                                        <span className="text-xs opacity-75">to {new Date(booking.check_out).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-text-light-primary dark:text-text-dark-primary">
                                    ₹{booking.total_amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OwnerRecentBookings;
