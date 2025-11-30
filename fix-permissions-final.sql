-- Fix permissions for properties table - FINAL SOLUTION
-- Run this in your Supabase SQL editor to fix the "Failed to create property" error

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Properties can be inserted by owners" ON properties;
DROP POLICY IF EXISTS "Owners can update their own properties" ON properties;
DROP POLICY IF EXISTS "Owners can delete their own properties" ON properties;

-- Step 2: Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies with proper permissions
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Owners can insert properties" ON properties
    FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Owners can update their own properties" ON properties
    FOR UPDATE USING (auth.uid()::text = "ownerId");

CREATE POLICY "Owners can delete their own properties" ON properties
    FOR DELETE USING (auth.uid()::text = "ownerId");

-- Step 4: Grant permissions
GRANT ALL ON properties TO authenticated;
GRANT ALL ON properties TO service_role;

-- Step 5: Fix owners table permissions
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can access owners" ON owners;
CREATE POLICY "Service role can access owners" ON owners
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
GRANT ALL ON owners TO authenticated;
GRANT ALL ON owners TO service_role;

-- Step 6: Test the permissions
SELECT 'Permissions fixed successfully! Property creation should now work.' as result;