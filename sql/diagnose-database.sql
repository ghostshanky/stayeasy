-- Database Diagnosis Script
-- Run this to understand the current state of your database

-- Check if tables exist
SELECT 
    'users' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
    ) as exists_flag
UNION ALL
SELECT 
    'sessions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) as exists_flag
UNION ALL
SELECT 
    'audit_logs' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
    ) as exists_flag;

-- Check RLS status on existing tables
SELECT 
    table_name,
    row_level_security
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND table_name IN ('users', 'sessions', 'audit_logs');

-- Check current user and permissions
SELECT 
    current_user,
    current_role,
    session_user;

-- Try to access tables without RLS restrictions
SELECT 'Attempting direct table access...' as test;

-- Test users table access
SELECT COUNT(*) as users_count FROM users LIMIT 1;

-- Test sessions table access  
SELECT COUNT(*) as sessions_count FROM sessions LIMIT 1;

-- Test audit_logs table access
SELECT COUNT(*) as audit_logs_count FROM audit_logs LIMIT 1;

-- Show all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show all policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;