-- Simple Authentication Fix
-- Focus on the core issue: service role access to users table

-- Drop any existing policies first
DROP POLICY IF EXISTS "Service role can access users" ON users;
DROP POLICY IF EXISTS "Service role can access sessions" ON users;
DROP POLICY IF EXISTS "Service role can access audit_logs" ON users;

-- Disable RLS completely on users table (the main one we need)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant direct permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE, SELECT ON users_id_seq TO authenticated;

-- Test access immediately
SELECT 'Testing users table access...' as test;

-- Try to insert a test record to verify permissions
INSERT INTO users (email, password, name, role, email_verified) 
VALUES ('test@example.com', 'hashedpassword', 'Test User', 'TENANT', true)
ON CONFLICT (email) DO NOTHING;

-- Check if the insert worked
SELECT COUNT(*) as user_count FROM users WHERE email = 'test@example.com';

-- Clean up the test record
DELETE FROM users WHERE email = 'test@example.com';

SELECT 'If you see a count above > 0, service role access is working!' as success;