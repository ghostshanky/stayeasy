-- Fix Authentication RLS (Row Level Security) Issues
-- Run this script in your Supabase SQL Editor

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table to allow service role access
CREATE POLICY IF NOT EXISTS "Service role can read all users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable RLS on sessions table if not already enabled
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions table to allow service role access
CREATE POLICY IF NOT EXISTS "Service role can manage sessions" ON sessions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable RLS on audit_logs table if not already enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs table to allow service role access
CREATE POLICY IF NOT EXISTS "Service role can manage audit logs" ON audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- If refresh_tokens table exists, enable RLS on it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
        CREATE POLICY IF NOT EXISTS "Service role can manage refresh tokens" ON refresh_tokens
            FOR ALL USING (
                auth.jwt() ->> 'role' = 'service_role'
            );
        RAISE NOTICE 'refresh_tokens table RLS policies created';
    ELSE
        RAISE NOTICE 'refresh_tokens table does not exist, skipping';
    END IF;
END $$;

-- Grant service role permissions to the service role user
GRANT ALL ON users TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;

-- If refresh_tokens table exists, grant permissions to it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        GRANT ALL ON refresh_tokens TO authenticated;
        RAISE NOTICE 'refresh_tokens table permissions granted';
    ELSE
        RAISE NOTICE 'refresh_tokens table does not exist, skipping permissions';
    END IF;
END $$;

-- Create a function to check if RLS is working
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        table_name,
        rls_enabled
    FROM 
        information_schema.tables
    WHERE 
        table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'audit_logs', 'refresh_tokens');
END;
$$ LANGUAGE plpgsql;

-- Check the status
SELECT * FROM check_rls_status();

-- Display completion message
SELECT 'RLS Fix Completed Successfully!' as status;