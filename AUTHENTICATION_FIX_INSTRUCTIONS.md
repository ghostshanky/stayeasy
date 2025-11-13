# 🔐 Authentication Fix Instructions

## Problem
You're experiencing authentication errors because the database schema is missing required columns for the authentication system to work properly.

## Quick Fix

### Option 1: Run the SQL Script Directly (Recommended)

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the entire content from `sql/fix-auth-schema.sql`
4. Click "Run" to execute the script

### Option 2: Use the Node.js Script

1. Make sure you have Node.js installed
2. Install dependencies: `npm install`
3. Run the fix script: `node scripts/quick-fix-auth.js`

### Option 3: Use the TypeScript Script

1. Make sure you have TypeScript installed: `npm install -g typescript`
2. Run the fix script: `npx tsx scripts/quick-fix-auth.ts`

## What the Fix Does

The script adds the missing columns to your database:

- `email_verified BOOLEAN DEFAULT false` - For email verification status
- `email_token VARCHAR(255)` - For email verification tokens
- `email_token_expiry TIMESTAMP` - For token expiration
- Various other missing columns for properties, bookings, payments, etc.

## After the Fix

1. ✅ The authentication system should work properly
2. ✅ You should be able to sign up and log in
3. ✅ Email verification should work
4. ✅ All other features should function normally

## Verification

After running the fix, try these steps:

1. Go to the login page
2. Try to create a new account
3. Try to log in with the new account
4. Check if you receive any authentication errors

## Still Having Issues?

If you continue to experience authentication issues:

1. Check your browser console for any errors
2. Check your server logs for detailed error messages
3. Verify that your `.env` file has the correct Supabase credentials
4. Make sure your Supabase project is properly configured

## Support

If you need further assistance, please check the troubleshooting section or contact support.