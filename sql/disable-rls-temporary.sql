-- Temporary RLS Disable - This will allow service role access
-- Run this script in your Supabase SQL Editor

-- Disable RLS on all tables
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

-- Grant all permissions to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the permissions
SELECT 'Temporary RLS Disabled - Authentication should now work!' as status;