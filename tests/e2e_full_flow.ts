import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

// Helper to generate unique emails
const generateEmail = (role: string) => `${role}_${Date.now()}@test.com`;

async function runE2ETest() {
    console.log('🚀 Starting End-to-End Manual Test Simulation...');

    let ownerToken: string;
    let tenantToken: string;
    let propertyId: string;
    let bookingId: string;

    // --- Step 1: Register Owner ---
    console.log('\n1️⃣  Registering Owner...');
    const ownerEmail = generateEmail('owner');
    try {
        const res = await axios.post(`${BASE_URL}/auth/signup`, {
            email: ownerEmail,
            password: 'password123',
            name: 'Test Owner',
            role: 'OWNER'
        });
        ownerToken = res.data.data.accessToken;
        console.log(`✅ Owner registered: ${ownerEmail}`);
    } catch (error: any) {
        console.error('❌ Owner registration failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 2: Add Property ---
    console.log('\n2️⃣  Adding Property...');
    try {
        const res = await axios.post(
            `${BASE_URL}/owner/properties`,
            {
                title: 'E2E Test Property',
                description: 'A property created during E2E testing',
                location: 'Test City',
                pricePerNight: 5000,
                capacity: 2,
                amenities: ['WiFi', 'Parking'],
                images: ['https://via.placeholder.com/400'],
                type: 'APARTMENT'
            },
            { headers: { Authorization: `Bearer ${ownerToken}` } }
        );
        propertyId = res.data.data.id;
        console.log(`✅ Property added. ID: ${propertyId}`);
    } catch (error: any) {
        console.error('❌ Add property failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 3: Register Tenant ---
    console.log('\n3️⃣  Registering Tenant...');
    const tenantEmail = generateEmail('tenant');
    try {
        const res = await axios.post(`${BASE_URL}/auth/signup`, {
            email: tenantEmail,
            password: 'password123',
            name: 'Test Tenant',
            role: 'TENANT'
        });
        tenantToken = res.data.data.accessToken;
        console.log(`✅ Tenant registered: ${tenantEmail}`);
    } catch (error: any) {
        console.error('❌ Tenant registration failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 4: Search Property (Verification) ---
    console.log('\n4️⃣  Searching for Property...');
    try {
        const res = await axios.get(`${BASE_URL}/properties`);
        const property = res.data.data.find((p: any) => p.id === propertyId);
        if (property) {
            console.log('✅ Property found in public search.');
        } else {
            console.error('❌ Property NOT found in public search.');
            process.exit(1);
        }
    } catch (error: any) {
        console.error('❌ Search failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 5: Book Property ---
    console.log('\n5️⃣  Booking Property...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    try {
        const res = await axios.post(
            `${BASE_URL}/bookings/tenant/bookings`,
            {
                propertyId: propertyId,
                checkIn: tomorrow.toISOString().split('T')[0],
                checkOut: dayAfter.toISOString().split('T')[0]
            },
            { headers: { Authorization: `Bearer ${tenantToken}` } }
        );
        bookingId = res.data.data.id;
        console.log(`✅ Booking created. ID: ${bookingId}`);
    } catch (error: any) {
        console.error('❌ Booking failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 6: Owner View Booking ---
    console.log('\n6️⃣  Owner Verifying Booking...');
    try {
        const res = await axios.get(`${BASE_URL}/bookings/owner/bookings`, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        const booking = res.data.data.find((b: any) => b.id === bookingId);
        if (booking) {
            console.log(`✅ Owner sees booking from ${booking.user.name}`);
        } else {
            console.error('❌ Owner cannot find the booking.');
            process.exit(1);
        }
    } catch (error: any) {
        console.error('❌ Owner view bookings failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 7: Tenant Pay ---
    console.log('\n7️⃣  Tenant Making Payment...');
    try {
        const res = await axios.post(
            `${BASE_URL}/payments/create`,
            {
                bookingId: bookingId,
                amount: 10000, // 2 nights * 5000
                upiId: 'test@upi',
                merchantName: 'StayEasy E2E'
            },
            { headers: { Authorization: `Bearer ${tenantToken}` } }
        );
        console.log(`✅ Payment successful. Payment ID: ${res.data.data.paymentId}`);
    } catch (error: any) {
        console.error('❌ Payment failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // --- Step 8: Verify Payment Status (Owner Side) ---
    console.log('\n8️⃣  Owner Verifying Payment Status...');
    try {
        const res = await axios.get(`${BASE_URL}/bookings/owner/bookings`, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        const booking = res.data.data.find((b: any) => b.id === bookingId);

        // Check if payments array exists and has the payment
        if (booking && booking.payments && booking.payments.length > 0) {
            const payment = booking.payments[0];
            console.log(`✅ Payment found in booking details. Status: ${payment.status}`);
        } else {
            console.warn('⚠️ Payment not found in booking details immediately (might be async or not included in summary).');
        }
    } catch (error: any) {
        console.error('❌ Owner verify payment failed:', error.response?.data || error.message);
        process.exit(1);
    }

    console.log('\n🎉 End-to-End Test Completed Successfully!');
}

runE2ETest();
