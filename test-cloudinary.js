// Test Cloudinary upload
const testCloudinaryUpload = async () => {
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    try {
        console.log('🧪 Testing Cloudinary upload...');

        const response = await fetch('http://localhost:3002/api/test/test-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileBase64: testImageBase64 })
        });

        const data = await response.json();

        console.log('\n📊 Response Status:', response.status);
        console.log('📦 Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS! Cloudinary upload works!');
            console.log('🔗 Image URL:', data.imageUrl);
        } else {
            console.log('\n❌ FAILED!');
            console.log('Error:', data.error);
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error.message);
    }
};

testCloudinaryUpload();
