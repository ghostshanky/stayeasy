-- Fix Application Table Permissions
-- This script sets up proper RLS policies for all application tables
-- Run this script in your Supabase SQL Editor

-- Enable Row Level Security on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Owners can manage their properties" ON properties;
DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Users can view messages they're involved in" ON messages;
DROP POLICY IF EXISTS "Users can view chats they're involved in" ON chats;
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can view their reviews" ON reviews;

-- Create policies for properties table
CREATE POLICY "Public can read properties" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert properties" ON properties
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

CREATE POLICY "Owners can manage their properties" ON properties
    FOR ALL USING (
        auth.uid()::text = owner_id
    );

-- Create policies for bookings table
CREATE POLICY "Users can view their bookings" ON bookings
    FOR SELECT USING (
        auth.uid()::text = user_id
    );

CREATE POLICY "Users can insert bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

CREATE POLICY "Owners can view bookings for their properties" ON bookings
    FOR SELECT USING (
        auth.uid()::text = (SELECT owner_id FROM properties WHERE id = bookings.property_id)
    );

-- Create policies for messages table
CREATE POLICY "Users can view messages they're involved in" ON messages
    FOR SELECT USING (
        auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
    );

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

-- Create policies for chats table
CREATE POLICY "Users can view chats they're involved in" ON chats
    FOR SELECT USING (
        auth.uid()::text = user1_id OR auth.uid()::text = user2_id
    );

CREATE POLICY "Users can insert chats" ON chats
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

-- Create policies for payments table
CREATE POLICY "Users can view their payments" ON payments
    FOR SELECT USING (
        auth.uid()::text = user_id
    );

CREATE POLICY "Users can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

-- Create policies for reviews table
CREATE POLICY "Users can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

-- Grant usage on schema to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on all tables to authenticated role
GRANT SELECT ON properties TO authenticated;
GRANT SELECT ON bookings TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON chats TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON reviews TO authenticated;

-- Test the permissions
SELECT 'Testing permissions...' as test;

-- Test if we can select from properties
SELECT COUNT(*) as properties_count FROM properties;

-- Test if we can insert a test property (this should work with proper auth)
-- INSERT INTO properties (id, title, description, price_per_night, location, owner_id, created_at, updated_at)
-- VALUES (gen_random_uuid()::text, 'Test Property', 'Test Description', 100, 'Test Location', auth.uid()::text, NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

SELECT 'If you see counts above, basic permissions are working!' as success;