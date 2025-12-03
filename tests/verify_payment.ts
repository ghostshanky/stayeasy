import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

async function login(email: string, password: string) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        return response.data.data.accessToken;
    } catch (error: any) {
        console.error(`Login failed for ${email}:`, error.response?.data || error.message);
        return null;
    }
}

async function verifyPayment() {
    console.log('Logging in as Tenant (tenant2@example.com)...');
    const tenantToken = await login('tenant2@example.com', 'password');
    if (!tenantToken) process.exit(1);
    console.log('Tenant logged in.');

    // Create a new booking
    console.log('Creating a new booking...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    let bookingId;
    try {
        const bookingResponse = await axios.post(
            `${BASE_URL}/bookings/tenant/bookings`,
            {
                propertyId: 'prop-3',
                checkIn: tomorrow.toISOString().split('T')[0],
                checkOut: dayAfter.toISOString().split('T')[0]
            },
            {
                headers: { Authorization: `Bearer ${tenantToken}` }
            }
        );
        if (bookingResponse.data.success) {
            bookingId = bookingResponse.data.data.id;
            console.log('Booking created successfully. ID:', bookingId);
        } else {
            console.error('Failed to create booking:', bookingResponse.data.error);
            process.exit(1);
        }
    } catch (error: any) {
        console.error('Failed to create booking:', error.response?.data || error.message);
        process.exit(1);
    }

    console.log(`Creating payment for ${bookingId}...`);
    try {
        const response = await axios.post(
            `${BASE_URL}/payments/create`,
            {
                bookingId: bookingId,
                amount: 180000,
                upiId: 'test@upi',
                merchantName: 'StayEasy Test'
            },
            {
                headers: { Authorization: `Bearer ${tenantToken}` }
            }
        );

        if (response.data.success) {
            console.log('Payment created successfully.');
            console.log('Payment ID:', response.data.data.paymentId);
        } else {
            console.error('Failed to create payment (API returned success=false):', response.data.error);
            process.exit(1);
        }
    } catch (error: any) {
        console.error('Failed to create payment:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyPayment();
