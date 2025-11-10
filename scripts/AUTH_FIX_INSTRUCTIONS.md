# 🔧 Authentication Fix Instructions

## Problem Summary
Your authentication system is completely broken because the database schema is missing critical tables and has column name inconsistencies.

## Root Causes Identified

1. **Missing `refresh_tokens` table**: The authentication service expects this table to store refresh tokens, but it doesn't exist in your database schema.

2. **Column name mismatches**: The auth service uses snake_case column names (`email_verified`, `email_token`) but the schema has camelCase names (`emailVerified`, `emailToken`).

3. **Missing RLS policies**: The database tables need proper Row Level Security policies for authentication to work.

## Step-by-Step Fix

### Step 1: Apply Database Schema Fix

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/rrcorcikdfxpdwvinotl

2. **Navigate to SQL Editor**: In the left sidebar, click on "SQL Editor"

3. **Create new query**: Click "New query" and name it "Fix authentication schema"

4. **Run the SQL script**: Copy and paste the entire content from `scripts/fix-auth-database-minimal.sql` and click "Run"

**Note**: The minimal script is the most reliable and includes:
- Adds missing authentication columns to users table
- Creates refresh_tokens table with proper foreign keys
- Sets up RLS policies for secure access
- Works with existing schema without conflicts

### Step 2: Test Authentication

After running the SQL script, test the authentication:

1. **Try signing up a new user**:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`

2. **Check server logs** for success messages:
   ```
   ✅ [AuthService.createUser] User created successfully
   ✅ [AuthService.createSession] Session created successfully
   ```

3. **Test login** with the same credentials
4. **Verify successful redirect** to dashboard

### Step 2: Verify the Fix

After running the SQL script, you should see:

- ✅ `refresh_tokens` table created
- ✅ Column names renamed from camelCase to snake_case
- ✅ RLS policies created for both `users` and `refresh_tokens` tables
- ✅ Proper permissions granted

### Step 3: Test Authentication

1. **Start your application** (if not already running):
   ```bash
   npm run server
   ```

2. **Open your browser** and navigate to the signup page

3. **Test with a new user**:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`

4. **Check the server logs** for diagnostic messages:
   ```
   🔐 [AuthService.createUser] Creating user: { email: 'test@example.com', name: 'Test User', role: 'TENANT' }
   ✅ [AuthService.createUser] User created successfully: [user-id]
   ✅ [AuthService.createSession] Session created successfully
   ```

### Step 4: Test Login

1. **Use the same credentials** to login
2. **Check server logs**:
   ```
   🔍 [AuthService.authenticateUser] Attempting to authenticate user: test@example.com
   ✅ [AuthService.authenticateUser] User authenticated successfully: [user-id]
   ```

## Expected Behavior After Fix

### ✅ Working Authentication
- Users can sign up successfully
- User data is stored in Supabase `users` table
- Login works with correct credentials
- JWT tokens are generated and stored
- Users are redirected to dashboard after login

### 🔍 Diagnostic Logging
The server now provides detailed logging for authentication:
- `🔐 [AuthService.createUser]` - User creation process
- `🔍 [AuthService.authenticateUser]` - Login attempts
- `🎯 [AuthService.createSession]` - Session creation
- `❌ [AuthService.*]` - Error messages with details

## Troubleshooting

### If Issues Persist

1. **Check Supabase connection**:
   ```bash
   curl http://localhost:3002/api/health
   ```

2. **Test Supabase connection**:
   ```bash
   curl http://localhost:3002/test-supabase
   ```

3. **Check server logs** for specific error messages

4. **Verify database schema**:
   - In Supabase dashboard, go to "Table Editor"
   - Confirm `users` and `refresh_tokens` tables exist
   - Check column names are in snake_case

### Common Error Messages

- `Failed to create user: relation "refresh_tokens" does not exist` → Run the SQL script
- `column email_verified does not exist` → Run the SQL script
- `permission denied for table users` → Check RLS policies

## Security Notes

- ✅ Row Level Security (RLS) is properly configured
- ✅ Users can only access their own data
- ✅ Refresh tokens are properly hashed and stored
- ✅ JWT tokens have appropriate expiration times

## Files Modified

1. `server/auth.ts` - Added comprehensive diagnostic logging
2. `scripts/fix-auth-database.sql` - Database schema fix script
3. `scripts/fix-auth-database.js` - Node.js script for database fix (alternative)

## Next Steps

1. Apply the database fix using the SQL script
2. Test authentication with a new user
3. Verify the user appears in Supabase dashboard
4. Test login with the created user
5. Confirm successful redirect to dashboard

## Support

If you continue to experience issues after following these steps, please:
1. Check the server console logs for error messages
2. Verify the database schema in Supabase dashboard
3. Ensure all environment variables are correctly set