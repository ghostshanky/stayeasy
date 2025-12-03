async function test() {
    try {
        console.log('Testing proxy...');
        const response = await fetch('http://localhost:5173/api/properties');
        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Data length:', data.data ? data.data.length : 'No data field');
        } else {
            const text = await response.text();
            console.log('Error body:', text);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
