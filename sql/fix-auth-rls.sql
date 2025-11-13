-- Fix Authentication RLS (Row Level Security) Issues
-- Run this script in your Supabase SQL Editor

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can read all users" ON users;
DROP POLICY IF EXISTS "Service role can manage sessions" ON sessions;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can manage refresh tokens" ON refresh_tokens;

-- Disable RLS temporarily to allow schema access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- If refresh_tokens table exists, disable RLS on it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'refresh_tokens table RLS disabled';
    ELSE
        RAISE NOTICE 'refresh_tokens table does not exist, skipping';
    END IF;
END $$;

-- Grant full permissions to service_role
GRANT ALL ON users TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON audit_logs TO service_role;

-- If refresh_tokens table exists, grant permissions to it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        GRANT ALL ON refresh_tokens TO service_role;
        RAISE NOTICE 'refresh_tokens table permissions granted';
    ELSE
        RAISE NOTICE 'refresh_tokens table does not exist, skipping permissions';
    END IF;
END $$;

-- Grant usage on schema to service_role
GRANT USAGE ON SCHEMA public TO service_role;

-- Check RLS status manually
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM
    pg_tables
WHERE
    schemaname = 'public'
    AND tablename IN ('users', 'sessions', 'audit_logs', 'refresh_tokens');

-- Display completion message
SELECT 'RLS Fix Completed Successfully! RLS is now DISABLED for service role access.' as status;
