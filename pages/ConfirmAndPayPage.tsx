import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import axios from 'axios';

const ConfirmAndPayPage = ({ navigate }: { navigate: (page: Page) => void }) => {
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get booking details from localStorage or props
    const booking = localStorage.getItem('currentBooking');
    if (booking) {
      setBookingDetails(JSON.parse(booking));
    }
  }, []);

  const handleCreatePayment = async () => {
    if (!bookingDetails) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3002/api/payments/create', {
        bookingId: bookingDetails.id,
        amount: bookingDetails.totalAmount ? bookingDetails.totalAmount * 100 : 10000, // Convert to paise
      });

      if (response.data.success) {
        setPaymentData(response.data.data);
      } else {
        setError('Failed to create payment');
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      setError('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    setError(null);

    try {
      // Generate a random transaction ID for demo purposes
      const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const response = await axios.post('http://localhost:3002/api/payments/confirm', {
        paymentId: paymentData.paymentId,
        transactionId: transactionId,
        upiReference: 'UPIREF' + Date.now()
      });

      if (response.data.success) {
        alert('Payment confirmed successfully!');
        navigate('tenantDashboard');
      } else {
        setError('Failed to confirm payment');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError('Failed to confirm payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            No Booking Found
          </h2>
          <button
            onClick={() => navigate('landing')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('propertyDetails')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Property Details
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-8 text-center">
            Confirm & Pay
          </h1>

          {/* Booking Summary */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Property</p>
                <p className="font-medium">{bookingDetails.propertyName || 'Property Name'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-in</p>
                <p className="font-medium">{bookingDetails.checkIn || 'Check-in Date'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-out</p>
                <p className="font-medium">{bookingDetails.checkOut || 'Check-out Date'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="font-medium text-2xl text-primary">₹{bookingDetails.totalAmount || 100}</p>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!paymentData ? (
            <div className="text-center">
              <button
                onClick={handleCreatePayment}
                disabled={loading}
                className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Payment...' : 'Create UPI Payment'}
              </button>
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Scan QR Code to Pay</h3>
                <div className="flex justify-center mb-4">
                  <img
                    src={paymentData.qrCode || paymentData.upiUri}
                    alt="UPI Payment QR Code"
                    className="border-4 border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Or click the payment link to open in UPI app
                </p>
                <a
                  href={paymentData.upiUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Open UPI App
                </a>
              </div>

              <div className="border-t pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    After completing payment in your UPI app, click confirm below
                  </p>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Confirming Payment...' : 'Confirm Payment'}
                  </button>
                  {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPayPage;
