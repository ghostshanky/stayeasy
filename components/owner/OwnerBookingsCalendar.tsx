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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500';
    case 'CONFIRMED':
      return 'bg-green-500';
    case 'CANCELLED':
      return 'bg-red-500';
    case 'COMPLETED':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const OwnerBookingsCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { items: bookings, loading, error } = useOwnerBookings(100, 1); // Fetch more bookings for calendar view

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return date >= checkIn && date <= checkOut;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days: JSX.Element[] = [];
    
    // Previous month's days
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push(
        <div 
          key={`prev-${i}`} 
          className="p-2 text-center text-text-light-secondary dark:text-text-dark-secondary text-sm opacity-50"
        >
          {daysInPrevMonth - i}
        </div>
      );
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayBookings = getBookingsForDate(date);
      const isCurrentDay = isToday(date);
      
      days.push(
        <div 
          key={`current-${i}`}
          className={`p-2 text-center border rounded-lg cursor-pointer hover:bg-background-light dark:hover:bg-background-dark transition-colors ${
            isCurrentDay ? 'border-primary' : 'border-border-light dark:border-border-dark'
          } ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-primary/10' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm ${isCurrentDay ? 'font-bold text-primary' : 'text-text-light-primary dark:text-text-dark-primary'}`}>
            {i}
          </div>
          <div className="flex flex-wrap justify-center gap-1 mt-1">
            {dayBookings.slice(0, 3).map(booking => (
              <div 
                key={booking.id} 
                className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`}
                title={`${booking.property.name} - ${booking.status}`}
              />
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                +{dayBookings.length - 3}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Next month's days
    const totalCells = 42; // 6 rows x 7 days
    const remainingCells = totalCells - days.length;
    
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div 
          key={`next-${i}`} 
          className="p-2 text-center text-text-light-secondary dark:text-text-dark-secondary text-sm opacity-50"
        >
          {i}
        </div>
      );
    }
    
    return days;
  };

  const renderSelectedDateBookings = () => {
    if (!selectedDate) return null;
    
    const dateBookings = getBookingsForDate(selectedDate);
    
    if (dateBookings.length === 0) {
      return (
        <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
          No bookings for {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
          Bookings on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        {dateBookings.map(booking => (
          <div 
            key={booking.id} 
            className="p-4 border border-border-light dark:border-border-dark rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary">{booking.property.name}</h4>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{booking.user.name}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <p>Check-in: {new Date(booking.check_in).toLocaleDateString('en-IN')}</p>
              <p>Check-out: {new Date(booking.check_out).toLocaleDateString('en-IN')}</p>
              <p className="font-medium">₹{booking.total_price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
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
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Bookings Calendar</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
            {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div 
            key={day} 
            className="p-2 text-center text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
          {renderSelectedDateBookings()}
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsCalendar;