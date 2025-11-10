-- Fix authentication database schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Add missing refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ip VARCHAR(45),
    device VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at);

-- Fix column name inconsistencies by renaming camelCase columns to snake_case
-- Check if columns exist first, then rename them
DO $$
BEGIN
    -- Check and rename emailVerified to email_verified
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN emailVerified TO email_verified';
        RAISE NOTICE 'Renamed emailVerified to email_verified';
    END IF;
    
    -- Check and rename emailToken to email_token
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailToken') THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN emailToken TO email_token';
        RAISE NOTICE 'Renamed emailToken to email_token';
    END IF;
    
    -- Check and rename emailTokenExpiry to email_token_expiry
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'emailTokenExpiry') THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN emailTokenExpiry TO email_token_expiry';
        RAISE NOTICE 'Renamed emailTokenExpiry to email_token_expiry';
    END IF;
    
    -- Check and rename createdAt to created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdAt') THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN createdAt TO created_at';
        RAISE NOTICE 'Renamed createdAt to created_at';
    END IF;
    
    -- Check and rename updatedAt to updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updatedAt') THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN updatedAt TO updated_at';
        RAISE NOTICE 'Renamed updatedAt to updated_at';
    END IF;
END
$$;

-- Enable Row Level Security (RLS) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users are readable by authenticated users" ON users;
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;
    DROP POLICY IF EXISTS "Users can delete their own data" ON users;
    
    -- Create new policies
    CREATE POLICY "Users are readable by authenticated users" ON users
        FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Users can insert their own data" ON users
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update their own data" ON users
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can delete their own data" ON users
        FOR DELETE USING (auth.uid() = id);
END
$$;

-- Enable Row Level Security (RLS) for refresh_tokens table
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for refresh_tokens table
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can manage their own refresh tokens" ON refresh_tokens;
    
    -- Create new policy
    CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
        FOR ALL USING (auth.uid() = user_id);
END
$$;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON refresh_tokens TO authenticated;
GRANT ALL ON refresh_tokens_id_seq TO authenticated;

-- Verify the setup
SELECT 
    'users' as table_name,
    json_agg(json_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable
    )) as columns
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
GROUP BY table_name;

SELECT 
    'refresh_tokens' as table_name,
    json_agg(json_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable
    )) as columns
FROM information_schema.columns 
WHERE table_name = 'refresh_tokens' AND table_schema = 'public'
GROUP BY table_name;

-- Display RLS policies
SELECT 
    tablename as table_name,
    policyname as policy_name,
    permissive as permissive,
    roles,
    cmd as command,
    qual as qualification,
    with_check as with_check
FROM pg_policies 
WHERE tablename IN ('users', 'refresh_tokens')
ORDER BY tablename, policyname;