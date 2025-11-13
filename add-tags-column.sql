-- Add tags column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_properties_tags ON properties USING GIN(tags);

-- Grant necessary permissions
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY IF NOT EXISTS "Properties are public readable" ON properties
    FOR SELECT USING (true);

-- Create policy for authenticated users to insert/update their own properties
CREATE POLICY IF NOT EXISTS "Owners can manage their own properties" ON properties
    FOR ALL USING (auth.uid()::text = owner_id::text);

-- Grant usage on the table to authenticated users
GRANT USAGE ON properties TO authenticated;
GRANT SELECT ON properties TO authenticated;