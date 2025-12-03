
import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

async function test() {
    try {
        // 1. Login as Tenant
        console.log('--- Testing Tenant ---');
        const tenantLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'tenent@gmail.com',
            password: 'tenent'
        });

        const tenantToken = tenantLogin.data.data?.accessToken || tenantLogin.data.accessToken;
        if (!tenantToken) {
            console.error('Tenant Token NOT FOUND');
            return;
        }
        console.log('Tenant Login Success');

        // 2. Fetch Tenant Bookings
        try {
            const tenantBookings = await axios.get(`${API_URL}/bookings/tenant/bookings`, {
                headers: { Authorization: `Bearer ${tenantToken}` }
            });
            console.log('Tenant Bookings Fetch Success:', tenantBookings.status);
        } catch (error: any) {
            console.error('Tenant Bookings Fetch Failed:', error.response?.status, error.response?.data);
        }

        // 3. Login as Owner
        console.log('\n--- Testing Owner ---');
        const ownerLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'owner@gmail.com',
            password: 'owner'
        });

        const ownerToken = ownerLogin.data.data?.accessToken || ownerLogin.data.accessToken;
        const ownerId = ownerLogin.data.data?.user?.id || ownerLogin.data.user?.id;

        if (!ownerToken) {
            console.error('Owner Token NOT FOUND');
            return;
        }
        console.log('Owner Login Success, ID:', ownerId);

        // 4. Fetch Owner Payments (No Filter)
        try {
            console.log('Fetching Owner Payments (No Filter)...');
            const ownerPayments = await axios.get(`${API_URL}/payments/owner/${ownerId}`, {
                headers: { Authorization: `Bearer ${ownerToken}` }
            });
            console.log('Owner Payments (No Filter) Success:', ownerPayments.status, ownerPayments.data.data?.length);
        } catch (error: any) {
            console.error('Owner Payments (No Filter) Failed:', error.response?.status, error.response?.data);
        }

        // 5. Fetch Owner Payments (With Filter)
        try {
            console.log('Fetching Owner Payments (With Filter: AWAITING_OWNER_VERIFICATION)...');
            const ownerPayments = await axios.get(`${API_URL}/payments/owner/${ownerId}?status=AWAITING_OWNER_VERIFICATION`, {
                headers: { Authorization: `Bearer ${ownerToken}` }
            });
            console.log('Owner Payments (With Filter) Success:', ownerPayments.status, ownerPayments.data.data?.length);
        } catch (error: any) {
            console.error('Owner Payments (With Filter) Failed:', error.response?.status, error.response?.data);
        }

    } catch (error: any) {
        console.error('Global Error:', error.message);
    }
}

test();
