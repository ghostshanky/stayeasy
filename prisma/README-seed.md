# Dummy Data Seeding

This directory contains scripts to populate your Supabase database with realistic dummy data for testing and development purposes.

## Data Structure

The dummy data includes:

### Users (4)
- **2 Owners**: Rahul Sharma, Priya Patel
- **2 Tenants**: Amit Kumar, Sneha Reddy

### Properties (6)
1. **Modern PG near Tech Park** (Bangalore) - ₹8,500/night
2. **Cozy Hostel in City Center** (Mumbai) - ₹4,500/night  
3. **Luxury Apartment PG** (Delhi NCR) - ₹12,000/night
4. **Student Hostel near University** (Pune) - ₹3,500/night
5. **Family PG with Amenities** (Chennai) - ₹6,800/night
6. **Working Professional PG** (Hyderabad) - ₹7,500/night

### Bookings (3)
- 3 confirmed/pending bookings across different properties

### Payments (3)
- 3 payments with different statuses (COMPLETED, PENDING, AWAITING_PAYMENT)

### Chats & Messages (2 chats, 4 messages)
- Realistic conversations between tenants and owners

### Reviews (2)
- Positive reviews for properties

## Usage

### Prerequisites
1. Ensure your Supabase database is running
2. Set up your environment variables in `.env`:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Running the Seed Script

```bash
# Navigate to the project root
cd /path/to/stayeasy

# Run the dummy data seeding
npm run seed:dummy
```

### Manual Cleanup

To remove all dummy data, you can use the Supabase dashboard or run SQL queries:

```sql
-- Delete all dummy data (be careful!)
DELETE FROM messages WHERE chat_id IN ('chat-1', 'chat-2');
DELETE FROM chats WHERE id IN ('chat-1', 'chat-2');
DELETE FROM reviews WHERE property_id IN ('prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5', 'prop-6');
DELETE FROM payments WHERE booking_id IN ('booking-1', 'booking-2', 'booking-3');
DELETE FROM bookings WHERE id IN ('booking-1', 'booking-2', 'booking-3');
DELETE FROM properties WHERE id IN ('prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5', 'prop-6');
DELETE FROM users WHERE email IN ('owner1@example.com', 'owner2@example.com', 'tenant1@example.com', 'tenant2@example.com');
```

## Testing the Application

After seeding the data, you can test:

1. **Owner Login**: Use `owner1@example.com` or `owner2@example.com` with password `password`
2. **Tenant Login**: Use `tenant1@example.com` or `tenant2@example.com` with password `password`
3. **Browse Properties**: View the 6 properties with realistic details
4. **Check Bookings**: View existing bookings and payments
5. **Messaging**: Test the chat functionality between tenants and owners
6. **Add Properties**: Use the "Add Property" button to create new properties

## Data Realism

The dummy data includes:
- Realistic Indian city locations
- Appropriate pricing for PG accommodations
- Relevant amenities for different property types
- Natural conversation flow in messages
- Proper booking and payment statuses
- Realistic user profiles and names

## Customization

You can modify the `seed-dummy-data.js` file to:
- Add more properties or users
- Change pricing or locations
- Modify amenities or tags
- Add more complex booking scenarios
- Customize message content