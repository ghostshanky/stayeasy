# Step-by-Step Authentication Fix

## Problem
You're getting `permission denied for schema public` errors when trying to login or signup.

## Solution
You need to fix the Row Level Security (RLS) permissions in your Supabase database.

### Step 1: Go to Your Supabase Dashboard
1. Open your Supabase project in the browser
2. Navigate to your project dashboard

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click on **New query**

### Step 3: Run This SQL Script
Copy and paste the following SQL commands into the SQL Editor:

```sql
-- Fix Authentication RLS Issues
-- Run this script in your Supabase SQL Editor

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create service role policy for users table
CREATE POLICY "Service role can access users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create service role policy for sessions table
CREATE POLICY "Service role can access sessions" ON sessions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create service role policy for audit_logs table
CREATE POLICY "Service role can access audit_logs" ON audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Grant service role permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;

-- Test the permissions
SELECT 'RLS Fix Applied Successfully!' as status;
```

### Step 4: Execute the Script
1. Click the **Run** button in the SQL Editor
2. Wait for the script to complete successfully

### Step 5: Restart Your Server
After running the SQL script, restart your server:
```bash
npm run server
```

### Step 6: Test Authentication
1. Try to signup with a new email address
2. Try to login with existing credentials
3. Check the browser console for any remaining errors

## Alternative: If the Above Doesn't Work

If you still get permission errors, try this more permissive approach:

```sql
-- Disable RLS completely (temporary fix)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

## Verification

After applying the fix, you should see:
- ✅ Signup works without 400 errors
- ✅ Login works without 401 errors
- ✅ No more "permission denied" messages in console

## If Issues Persist

1. **Check your service role key** in `.env` file
2. **Verify the tables exist** in your database
3. **Ensure you're using the correct project URL**
4. **Check that the SQL script ran without errors**

## Files That Were Already Fixed

✅ Environment variables in `.env`
✅ Authentication service logging in `server/auth.ts`
✅ Client-side logging in `client/src/hooks/useAuth.ts`
✅ Server-side logging in `server/server.ts`

The only remaining step is to run the SQL script above in your Supabase dashboard.