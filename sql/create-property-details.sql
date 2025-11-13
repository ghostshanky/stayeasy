-- Create Property Details for Sample Properties
-- This script adds detailed amenities and features for the sample properties

-- First, let's get the property IDs we just created and store them in variables
DO $$
DECLARE
    villa_id TEXT;
    apartment_id TEXT;
    retreat_id TEXT;
    hotel_id TEXT;
    cottage_id TEXT;
BEGIN
    -- Get the property IDs
    SELECT id INTO villa_id FROM properties
    WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431' AND title = 'Luxury Beach Villa' LIMIT 1;
    
    SELECT id INTO apartment_id FROM properties
    WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431' AND title = 'Modern City Apartment' LIMIT 1;
    
    SELECT id INTO retreat_id FROM properties
    WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431' AND title = 'Mountain Retreat' LIMIT 1;
    
    SELECT id INTO hotel_id FROM properties
    WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431' AND title = 'Heritage Hotel' LIMIT 1;
    
    SELECT id INTO cottage_id FROM properties
    WHERE owner_id = '1540765b-aa8b-47d1-8030-77eb00024431' AND title = 'Lakeside Cottage' LIMIT 1;
    
    -- Insert property details using the stored IDs
    INSERT INTO property_details (id, property_id, amenity, value) VALUES
    -- Luxury Beach Villa Details
    (gen_random_uuid(), villa_id, 'Bedrooms', '4'),
    (gen_random_uuid(), villa_id, 'Bathrooms', '3'),
    (gen_random_uuid(), villa_id, 'Square Feet', '3500'),
    (gen_random_uuid(), villa_id, 'Check-in Time', '3:00 PM'),
    (gen_random_uuid(), villa_id, 'Check-out Time', '11:00 AM'),
    (gen_random_uuid(), villa_id, 'Cancellation Policy', 'Free cancellation up to 24 hours before check-in'),

    -- Modern City Apartment Details
    (gen_random_uuid(), apartment_id, 'Bedrooms', '2'),
    (gen_random_uuid(), apartment_id, 'Bathrooms', '2'),
    (gen_random_uuid(), apartment_id, 'Square Feet', '1200'),
    (gen_random_uuid(), apartment_id, 'Check-in Time', '2:00 PM'),
    (gen_random_uuid(), apartment_id, 'Check-out Time', '11:00 AM'),
    (gen_random_uuid(), apartment_id, 'Cancellation Policy', 'Moderate cancellation policy'),

    -- Mountain Retreat Details
    (gen_random_uuid(), retreat_id, 'Bedrooms', '3'),
    (gen_random_uuid(), retreat_id, 'Bathrooms', '2'),
    (gen_random_uuid(), retreat_id, 'Square Feet', '2000'),
    (gen_random_uuid(), retreat_id, 'Check-in Time', '4:00 PM'),
    (gen_random_uuid(), retreat_id, 'Check-out Time', '10:00 AM'),
    (gen_random_uuid(), retreat_id, 'Cancellation Policy', 'Free cancellation up to 48 hours before check-in'),

    -- Heritage Hotel Details
    (gen_random_uuid(), hotel_id, 'Bedrooms', '6'),
    (gen_random_uuid(), hotel_id, 'Bathrooms', '5'),
    (gen_random_uuid(), hotel_id, 'Square Feet', '8000'),
    (gen_random_uuid(), hotel_id, 'Check-in Time', '12:00 PM'),
    (gen_random_uuid(), hotel_id, 'Check-out Time', '11:00 AM'),
    (gen_random_uuid(), hotel_id, 'Cancellation Policy', 'Free cancellation up to 72 hours before check-in'),

    -- Lakeside Cottage Details
    (gen_random_uuid(), cottage_id, 'Bedrooms', '2'),
    (gen_random_uuid(), cottage_id, 'Bathrooms', '2'),
    (gen_random_uuid(), cottage_id, 'Square Feet', '1500'),
    (gen_random_uuid(), cottage_id, 'Check-in Time', '3:00 PM'),
    (gen_random_uuid(), cottage_id, 'Check-out Time', '10:00 AM'),
    (gen_random_uuid(), cottage_id, 'Cancellation Policy', 'Free cancellation up to 24 hours before check-in');
    
    RAISE NOTICE 'Property details created successfully for all 5 properties';
END $$;

-- Verify the property details were created
SELECT 
    p.title,
    pd.amenity,
    pd.value
FROM property_details pd
JOIN properties p ON pd.property_id = p.id
WHERE p.owner_id = '1540765b-aa8b-47d1-8030-77eb00024431'
ORDER BY p.title, pd.amenity;

-- Display success message
SELECT '✅ Property details added successfully!' as status;
SELECT '📋 Additional amenities and features added to all 5 properties' as details;
SELECT '🏠 Properties now have complete information for booking' as completion;