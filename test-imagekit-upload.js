// Test ImageKit upload with actual credentials
const testImageKitUpload = async () => {
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const payload = {
        fileBase64: testImageBase64,
        userId: 'test-user-' + Date.now(),
        fileName: 'test-profile.png'
    };

    try {
        console.log('🧪 Testing ImageKit upload via API...');
        console.log('📤 Sending to: http://localhost:3002/api/images/upload-profile');

        const response = await fetch('http://localhost:3002/api/images/upload-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('\n📊 Response Status:', response.status);
        console.log('📦 Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS! Image uploaded!');
            console.log('🖼️  Image ID:', data.imageId);
            console.log('🔗 Image URL:', data.imageUrl);
        } else {
            console.log('\n❌ FAILED!');
            console.log('Error:', data.error);
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error.message);
    }
};

testImageKitUpload();
