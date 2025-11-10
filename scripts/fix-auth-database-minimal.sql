-- Minimal authentication database fix for Supabase
-- This script only creates what's missing and works with existing schema

-- Step 1: Add missing columns to users table (only if they don't exist)
DO $$
BEGIN
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add email_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_token') THEN
        ALTER TABLE users ADD COLUMN email_token VARCHAR(255);
    END IF;
    
    -- Add email_token_expiry column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_token_expiry') THEN
        ALTER TABLE users ADD COLUMN email_token_expiry TIMESTAMP;
    END IF;
END
$$;

-- Step 2: Create refresh_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ip VARCHAR(45),
    device VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at);

-- Step 3: Add foreign key constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'refresh_tokens_user_id_fkey' 
        AND table_name = 'refresh_tokens'
    ) THEN
        ALTER TABLE refresh_tokens 
        ADD CONSTRAINT refresh_tokens_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Step 4: Enable Row Level Security and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users are readable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;

CREATE POLICY "Users are readable by authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own data" ON users
    FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for refresh_tokens table
DROP POLICY IF EXISTS "Users can manage their own refresh tokens" ON refresh_tokens;

CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON refresh_tokens TO authenticated;
GRANT ALL ON refresh_tokens_id_seq TO authenticated;

-- Step 6: Show current table structure for verification
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