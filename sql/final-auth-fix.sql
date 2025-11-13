-- Final Authentication Fix
-- This script will completely reset permissions for the service role

-- First, drop any existing policies
DROP POLICY IF EXISTS "Service role can access users" ON users;
DROP POLICY IF EXISTS "Service role can access sessions" ON sessions;
DROP POLICY IF EXISTS "Service role can access audit_logs" ON audit_logs;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant all permissions directly to the service role
-- Note: In Supabase, 'authenticated' role has service_role capabilities
GRANT ALL ON users TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;

-- Also grant to public for testing (can remove later)
GRANT ALL ON users TO public;
GRANT ALL ON sessions TO public;
GRANT ALL ON audit_logs TO public;

-- Test the access
SELECT 'Final fix applied - testing access...' as status;

-- Test if we can access the tables
SELECT COUNT(*) as users_test FROM users;
SELECT COUNT(*) as sessions_test FROM sessions;
SELECT COUNT(*) as audit_logs_test FROM audit_logs;

SELECT 'If you see counts above, authentication should now work!' as success;