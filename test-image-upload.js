// Enhanced test image upload endpoint with better error reporting
const testImageUpload = async () => {
    // 1x1 pixel red PNG image in base64
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const payload = {
        fileBase64: testImageBase64,
        userId: 'test-user-' + Date.now(),
        fileName: 'test-profile.png'
    };

    try {
        console.log('🧪 Testing image upload endpoint...');
        console.log('📤 Sending request to: http://localhost:3002/api/images/upload-profile');
        console.log('📦 Payload:', {
            userId: payload.userId,
            fileName: payload.fileName,
            base64Length: payload.fileBase64.length
        });

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
            console.log('\n✅ SUCCESS! Image uploaded successfully');
            console.log('🖼️  Image ID:', data.imageId);
            console.log('🔗 Image URL:', data.imageUrl);
        } else {
            console.log('\n❌ FAILED! Upload error');
            console.log('Error Code:', data.error?.code);
            console.log('Error Message:', data.error?.message);
            console.log('Error Details:', data.error?.details);
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error.message);
        console.error('Stack:', error.stack);
    }
};

testImageUpload();
