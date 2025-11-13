# Supabase Database Permissions Fix

## Problem
The authentication is failing with "permission denied for schema public" because the service role key doesn't have proper permissions to access the custom `users` table.

## Solution
You need to run the following SQL commands in your Supabase dashboard:

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run the following SQL commands:

```sql
-- Fix Service Role Permissions for Custom Users Table
-- This script will grant proper permissions to the service role

-- First, drop any existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Service role can access users" ON public.users;
DROP POLICY IF EXISTS "Public can read users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can manage users" ON public.users;

-- Disable Row Level Security temporarily to grant permissions
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions to the authenticated role (which has service_role capabilities)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO public;

-- Create a proper policy for service role access
CREATE POLICY "Service role can access users" ON public.users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable Row Level Security back with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the fix
SELECT 'Database permissions fixed successfully!' as status;
SELECT COUNT(*) as total_users FROM public.users;
```

## Alternative Solution
If the above doesn't work, you can try a more permissive approach:

```sql
-- Alternative: More permissive permissions
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can access users" ON public.users;
DROP POLICY IF EXISTS "Public can read users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can manage users" ON public.users;

-- Disable RLS completely for testing (not recommended for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated role
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO public;

-- Test the access
SELECT 'Testing permissions...' as test;
SELECT COUNT(*) as users_count FROM public.users;

-- If this works, you can create proper RLS policies
CREATE POLICY "Service role can access users" ON public.users
    FOR ALL USING (true);

-- Enable RLS back
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

SELECT 'Permissions fixed!' as success;
```

## After Running the SQL
Once you've run the SQL commands in the Supabase dashboard, test the authentication again:

```bash
# Test signup
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Important Notes
1. **Security Warning**: The more permissive approach (using `USING (true)`) is less secure. For production, you should implement proper RLS policies based on user roles.

2. **Schema Name**: Make sure you're using the correct schema name (`public.users`).

3. **Service Role Key**: The service role key should have full access to all tables when RLS is properly configured.

4. **Testing**: After applying the fix, test both signup and login functionality.

## If You Still Have Issues
If you continue to have permission issues, you may need to:
1. Check that your service role key is correct in the `.env` file
2. Verify that the `users` table exists in the `public` schema
3. Ensure the table structure matches what the authentication service expects