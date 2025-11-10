-- Simple and robust authentication database fix for Supabase
-- This script handles existing tables and column names gracefully

-- Step 1: Create refresh_tokens table if it doesn't exist
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        CREATE TABLE refresh_tokens (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            ip VARCHAR(45),
            device VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created refresh_tokens table';
    ELSE
        RAISE NOTICE 'refresh_tokens table already exists';
    END IF;
END
$$;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at);

-- Step 3: Fix column names in users table (only if needed)
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

-- Step 4: Add foreign key constraint (only if needed)
DO $$
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'refresh_tokens_user_id_fkey' 
        AND table_name = 'refresh_tokens'
    ) THEN
        -- Add the foreign key constraint
        EXECUTE 'ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
        RAISE NOTICE 'Added foreign key constraint';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END
$$;

-- Step 5: Enable Row Level Security and create policies
DO $$
BEGIN
    -- Enable RLS for users table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public' 
                   AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users')) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users are readable by authenticated users" ON users
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Users can insert their own data" ON users
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Users can update their own data" ON users
            FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can delete their own data" ON users
            FOR DELETE USING (auth.uid() = id);
            
        RAISE NOTICE 'Created RLS policies for users table';
    ELSE
        RAISE NOTICE 'RLS policies for users table already exist';
    END IF;
    
    -- Enable RLS for refresh_tokens table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refresh_tokens' AND schemaname = 'public' 
                   AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refresh_tokens')) THEN
        ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
            FOR ALL USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created RLS policies for refresh_tokens table';
    ELSE
        RAISE NOTICE 'RLS policies for refresh_tokens table already exist';
    END IF;
END
$$;

-- Step 6: Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON refresh_tokens TO authenticated;
GRANT ALL ON refresh_tokens_id_seq TO authenticated;

-- Step 7: Verify the setup
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
ORDER BY tablename, policy_name;

RAISE NOTICE 'Authentication database fix completed successfully!';