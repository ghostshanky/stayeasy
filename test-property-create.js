const http = require('http');

const loginReq = http.request({
  hostname: 'localhost',
  port: 5177,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Login Response:', data);
    try {
      const response = JSON.parse(data);
      if (response.success) {
        const token = response.data.accessToken;
        console.log('Token:', token);
        // Now create property
        const propertyReq = http.request({
          hostname: 'localhost',
          port: 5177,
          path: '/api/owner/properties',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }, (propRes) => {
          let propData = '';
          propRes.on('data', (chunk) => propData += chunk);
          propRes.on('end', () => console.log('Property Create Response:', propData));
        });
        propertyReq.write(JSON.stringify({
          title: 'Modern & Cozy PG near Andheri West',
          description: 'It is Awesome : )',
          location: 'Andheri West , Sunnyvale Hostel , Mumbai',
          price_per_night: '900',
          capacity: '2',
          amenities: ['Wifi: Free', 'Air Conditioning: in every room'],
          tags: ['Air Conditioning', 'Sea Facing', 'Free wifi'],
          images: ['https://gsh-cdn.sgp1.cdn.digitaloceanspaces.com/assets/img/no-broker-mumbai/PRT703/room-on-rent-in-mumbai/pg-in-oshiwara.jpg'],
          ownerId: response.data.user.id
        }));
        propertyReq.end();
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
});

loginReq.write(JSON.stringify({ email: 'owner@example.com', password: 'password' }));
loginReq.end();
