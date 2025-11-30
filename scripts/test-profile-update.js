
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_URL = 'http://localhost:3002/api';

async function test() {
    try {
        // 1. Register
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';
        console.log('Registering user:', email);

        const regRes = await axios.post(`${API_URL}/auth/signup`, {
            email,
            password,
            name: 'Test User',
            role: 'TENANT'
        });

        const { user, accessToken } = regRes.data.data;
        console.log('Registered user ID:', user.id);
        // console.log('Token:', accessToken);

        // 2. Update Profile
        console.log('Updating profile...');
        try {
            const updateRes = await axios.put(`${API_URL}/users/${user.id}`, {
                name: 'Updated Name',
                bio: 'Updated Bio',
                mobile: '1234567890'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('✅ Update response:', updateRes.data);
        } catch (err) {
            console.error('❌ Update failed:', err.response ? err.response.data : err.message);
        }

        // 3. Upload Profile Image
        console.log('Uploading profile image...');
        const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='; // 1x1 red pixel
        try {
            const uploadRes = await axios.post(`${API_URL}/images/upload-profile`, {
                fileBase64: base64Image,
                userId: user.id,
                fileName: 'test.png'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('✅ Upload response:', uploadRes.data);
        } catch (err) {
            console.error('❌ Upload failed:', err.response ? err.response.data : err.message);
        }

    } catch (error) {
        console.error('Test setup failed (Registration):', error.response ? error.response.data : error.message);
    }
}

test();
