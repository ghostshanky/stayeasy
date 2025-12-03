
import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

async function testLogin() {
    console.log('--- Testing Login ---');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'owner@gmail.com',
            password: 'owner'
        });
        console.log('Login Success:', response.status);
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Login Failed:', error.response?.status);
        if (error.response?.data) {
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testLogin();
