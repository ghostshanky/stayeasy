-- Fix authentication schema by adding missing columns to users table
-- This script ensures the database schema matches the Prisma schema

-- Add missing email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_token_expiry TIMESTAMP;

-- Add missing columns to properties table (if they don't exist)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1;

-- Add missing columns to bookings table (if they don't exist)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to payments table (if they don't exist)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

-- Add missing columns to messages table (if they don't exist)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type VARCHAR(50) DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Add missing columns to notifications table (if they don't exist)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security (RLS) on properties table if not already enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties table
-- Allow public read access to properties
CREATE POLICY IF NOT EXISTS "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

-- Allow authenticated users to insert properties (for owners)
CREATE POLICY IF NOT EXISTS "Properties can be inserted by owners" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow owners to update their own properties
CREATE POLICY IF NOT EXISTS "Owners can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- Allow owners to delete their own properties
CREATE POLICY IF NOT EXISTS "Owners can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = owner_id);

-- Grant necessary permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- Grant usage on types to authenticator
GRANT USAGE ON TYPE public.role TO authenticator;
GRANT USAGE ON TYPE public.booking_status TO authenticator;
GRANT USAGE ON TYPE public.payment_status TO authenticator;

-- Verify the schema changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email_verified', 'email_token', 'email_token_expiry')
ORDER BY ordinal_position;

-- Display success message
SELECT '✅ Authentication schema fix completed successfully!' as status;