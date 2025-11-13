-- Check what tables actually exist and their structure
-- Run this first to understand your database

-- Show all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if specific tables exist
SELECT 
    'users' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists_flag
UNION ALL
SELECT 
    'auth.users' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth.users') as exists_flag;

-- Check users table structure if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Users table exists, showing structure:';
        DROP TABLE IF EXISTS temp_table_info;
        CREATE TEMP TABLE temp_table_info AS
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
        SELECT * FROM temp_table_info;
    ELSE
        RAISE NOTICE 'Users table does not exist in public schema';
    END IF;
END $$;

-- Check auth.users table structure if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth.users') THEN
        RAISE NOTICE 'Auth.users table exists, showing structure:';
        DROP TABLE IF EXISTS temp_auth_table_info;
        CREATE TEMP TABLE temp_auth_table_info AS
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'auth.users' 
        ORDER BY ordinal_position;
        SELECT * FROM temp_auth_table_info;
    ELSE
        RAISE NOTICE 'Auth.users table does not exist';
    END IF;
END $$;

-- Try to access the actual users table that should be used
SELECT 'Attempting to access users table...' as test;

-- This will tell us which table we can actually access
SELECT 'public.users count:' as table_name, COUNT(*) as count FROM users UNION ALL
SELECT 'auth.users count:' as table_name, COUNT(*) as count FROM auth.users;