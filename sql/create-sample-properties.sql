-- Create Sample Properties for Owner
-- This script creates 5 sample properties for the owner user: 1540765b-aa8b-47d1-8030-77eb00024431

-- First, let's verify the owner exists
SELECT id, email, name FROM users WHERE id = '1540765b-aa8b-47d1-8030-77eb00024431';

-- Insert sample properties
INSERT INTO properties (id, owner_id, title, location, description, price_per_night, images, rating, amenities, tags, capacity, created_at, updated_at) VALUES
-- Property 1: Luxury Beach Villa
(gen_random_uuid(), '1540765b-aa8b-47d1-8030-77eb00024431', 'Luxury Beach Villa', 'Goa, India', 'Experience ultimate luxury in this stunning beachfront villa. Features private beach access, infinity pool, and panoramic ocean views. Perfect for romantic getaways or family vacations.', 15000.00, ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'https://images.unsplash.com/photo-1600633927892-3830b68f930e?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'], 4.8, ARRAY['WiFi', 'Air Conditioning', 'Pool', 'Beach Access', 'Parking', 'Gym', 'Spa'], ARRAY['luxury', 'beach', 'villa', 'family', 'romantic'], 8, NOW(), NOW()),

-- Property 2: Modern City Apartment
(gen_random_uuid(), '1540765b-aa8b-47d1-8030-77eb00024431', 'Modern City Apartment', 'Mumbai, India', ' stylish and modern apartment in the heart of Mumbai. Close to major attractions, shopping centers, and public transport. Fully equipped with all modern amenities for a comfortable stay.', 8500.00, ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'], 4.5, ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Elevator', 'Parking', 'Gym', 'Laundry'], ARRAY['modern', 'city', 'apartment', 'business', 'convenient'], 4, NOW(), NOW()),

-- Property 3: Mountain Retreat
(gen_random_uuid(), '1540765b-aa8b-47d1-8030-77eb00024431', 'Mountain Retreat', 'Shimla, India', 'Escape to the serene mountains in this cozy retreat. Enjoy breathtaking views, fresh air, and peaceful surroundings. Ideal for nature lovers and those seeking a break from city life.', 6500.00, ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'], 4.7, ARRAY['WiFi', 'Heating', 'Fireplace', 'Mountain View', 'Parking', 'Hiking Trails', 'BBQ'], ARRAY['mountain', 'retreat', 'nature', 'peaceful', 'adventure'], 6, NOW(), NOW()),

-- Property 4: Heritage Hotel
(gen_random_uuid(), '1540765b-aa8b-47d1-8030-77eb00024431', 'Heritage Hotel', 'Jaipur, India', 'Step back in time with this beautifully restored heritage hotel. Experience royal hospitality and traditional Rajasthani architecture. Located in the heart of Jaipur near major tourist attractions.', 12000.00, ARRAY['https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800'], 4.9, ARRAY['WiFi', 'Air Conditioning', 'Restaurant', 'Swimming Pool', 'Parking', 'Spa', 'Cultural Tours'], ARRAY['heritage', 'royal', 'traditional', 'cultural', 'luxury'], 10, NOW(), NOW()),

-- Property 5: Lakeside Cottage
(gen_random_uuid(), '1540765b-aa8b-47d1-8030-77eb00024431', 'Lakeside Cottage', 'Udaipur, India', 'Charming cottage by the lake with stunning views. Perfect for a romantic getaway or peaceful vacation. Enjoy boat rides, sunset views, and authentic local cuisine.', 9500.00, ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'], 4.6, ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Lake View', 'Boat Access', 'Parking', 'Balcony'], ARRAY['lakeside', 'cottage', 'romantic', 'peaceful', 'scenic'], 5, NOW(), NOW());

-- Verify the properties were created
SELECT 
    id,
    title,
    location,
    price_per_night,
    rating,
    capacity,
    created_at
FROM properties 
WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431'
ORDER BY created_at DESC;

-- Display success message
SELECT '✅ Sample properties created successfully!' as status;
SELECT '🏠 5 properties added for owner: testuser@gmail.com' as owner_info;
SELECT '📍 Properties located in: Goa, Mumbai, Shimla, Jaipur, Udaipur' as locations;
SELECT '💰 Price range: ₹6,500 - ₹15,000 per night' as price_range;