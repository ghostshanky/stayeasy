# Authentication Fix Instructions

## Problem Summary
The authentication system is failing with:
- **Login Error 401**: "permission denied for schema public" 
- **Signup Error 400**: Database access issues

## Root Causes Identified

### 1. Missing Client-Side Environment Variables ✅ FIXED
The `.env` file was missing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` needed for client-side operations.

### 2. Database RLS (Row Level Security) Issues ❌ NEEDS FIX
The service role key doesn't have permissions to access database tables due to restrictive RLS policies.

### 3. Missing `refresh_tokens` Table Handling ✅ FIXED
The auth service was trying to access a non-existent `refresh_tokens` table. Updated to use `sessions` table as fallback.

## Fix Steps

### Step 1: Environment Variables (Already Fixed)
✅ Added missing client-side environment variables to `.env`:
```
VITE_SUPABASE_URL=https://rrcorcikdfxpdwvinotl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Fix Database RLS Permissions (REQUIRED)
You need to run the SQL script in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** > **New query**
3. Copy and paste the contents of [`sql/fix-auth-rls.sql`](sql/fix-auth-rls.sql)
4. Click **Run**

This script will:
- Enable RLS on `users`, `sessions`, and `audit_logs` tables
- Create service role policies for these tables
- Grant necessary permissions
- Handle the optional `refresh_tokens` table if it exists

### Step 3: Restart the Server
After running the SQL script, restart your server:
```bash
npm run server
```

## Testing the Fix

### Test Login
1. Open the application in your browser
2. Try to login with existing credentials or create a new account
3. Check the browser console for diagnostic logs
4. Check the server console for authentication logs

### Test Signup
1. Navigate to the signup page
2. Fill in the registration form
3. Submit the form
4. Check for success/error messages

## Diagnostic Logging Added

### Server-Side Logging
- Environment variable status checks
- Database table access diagnostics
- Authentication flow logging
- Error details with Supabase error codes

### Client-Side Logging
- API endpoint access logging
- Request/response logging
- Error details with HTTP status codes
- Token storage confirmation

## Expected Error Codes and Solutions

### `42501 - permission denied for schema public`
- **Cause**: RLS policies blocking service role access
- **Solution**: Run the [`sql/fix-auth-rls.sql`](sql/fix-auth-rls.sql) script

### `PGRST116 - no rows returned`
- **Cause**: User not found in database
- **Solution**: Check if user exists or create a new account

### `400 Bad Request`
- **Cause**: Missing required fields or invalid data
- **Solution**: Check request payload and database schema

## Files Modified

### Environment Configuration
- `.env` - Added missing client-side Supabase credentials

### Server-Side Code
- `server/auth.ts` - Added diagnostic logging and table fallback logic
- `server/server.ts` - Added environment status logging for auth endpoints

### Client-Side Code
- `client/src/hooks/useAuth.ts` - Added comprehensive diagnostic logging

### Database Scripts
- `sql/fix-auth-rls.sql` - RLS permission fix script
- `scripts/fix-auth-database.js` - Alternative Node.js script for database fixes

## Troubleshooting

### If Issues Persist After Running SQL Script

1. **Check Supabase Service Role Key**
   - Verify the service role key in `.env` is correct
   - Ensure it has `service_role` scope in Supabase dashboard

2. **Check Table Existence**
   - Run this in Supabase SQL Editor:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'audit_logs');
   ```

3. **Check RLS Status**
   - Run the `check_rls_status()` function created by the fix script

4. **Check Row Level Security Settings**
   - In Supabase dashboard, go to **Table Editor** > Select table > **Edit table** > **Row Level Security**

### Common Issues

1. **"relation does not exist" error**
   - The table doesn't exist in the database
   - Solution: Run the schema creation script first

2. **"permission denied" error persists**
   - RLS policies are still too restrictive
   - Solution: Check that service role policies were created correctly

3. **"invalid JWT" error**
   - JWT secret is incorrect or expired
   - Solution: Verify JWT secrets in `.env` file

## Support

If you continue to experience issues after following these steps:

1. Check the browser console for client-side errors
2. Check the server console for server-side errors
3. Verify all environment variables are set correctly
4. Ensure the SQL script was executed successfully in Supabase

## Verification Checklist

- [ ] `.env` file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] SQL script [`sql/fix-auth-rls.sql`](sql/fix-auth-rls.sql) has been executed in Supabase
- [ ] Server has been restarted after SQL script execution
- [ ] No TypeScript errors in the console
- [ ] Authentication endpoints are returning proper responses
- [ ] Users can be created and authenticated successfully