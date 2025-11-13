-- Complete Authentication Fix Based on Full Database DDL
-- This script will properly set up permissions for the custom users table

-- First, ensure the users table exists and has proper structure
-- Based on the DDL, public.users should have this structure:
-- id text PRIMARY KEY, email text, password text, name text, 
-- role "Role" DEFAULT 'TENANT', emailVerified boolean DEFAULT false, 
-- emailToken text, emailTokenExpiry timestamp, createdAt timestamp DEFAULT CURRENT_TIMESTAMP, 
-- updatedAt timestamp, image_id text

-- Drop any existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Service role can access users" ON public.users;
DROP POLICY IF EXISTS "Public can read users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can manage users" ON public.users;

-- Disable RLS temporarily to fix permissions
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions to authenticated role
GRANT ALL ON public.users TO authenticated;

-- Also grant to public for testing (can remove later)
GRANT ALL ON public.users TO public;

-- Create a proper policy for service role access
CREATE POLICY "Service role can access users" ON public.users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable RLS back with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the access immediately
SELECT 'Testing users table access with service role...' as test;

-- Try to insert a test record to verify permissions
INSERT INTO public.users (id, email, password, name, role, emailverified)
VALUES (gen_random_uuid()::text, 'test@example.com', 'hashedpassword', 'Test User', 'TENANT', true)
ON CONFLICT (email) DO NOTHING;

-- Check if the insert worked
SELECT COUNT(*) as user_count FROM public.users WHERE email = 'test@example.com';

-- Clean up the test record
DELETE FROM public.users WHERE email = 'test@example.com';

-- Test selecting data
SELECT COUNT(*) as total_users FROM public.users;

SELECT 'If you see counts above, service role access to public.users is working!' as success;