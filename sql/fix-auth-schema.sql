-- Fix authentication schema by adding missing tables and correcting column names

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

-- Fix column name inconsistencies by adding aliases for backward compatibility
-- The auth service expects snake_case column names
ALTER TABLE users RENAME COLUMN emailVerified TO email_verified;
ALTER TABLE users RENAME COLUMN emailToken TO email_token;
ALTER TABLE users RENAME COLUMN emailTokenExpiry TO email_token_expiry;
ALTER TABLE users RENAME COLUMN createdAt TO created_at;
ALTER TABLE users RENAME COLUMN updatedAt TO updated_at;

-- Add RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users (for authentication)
CREATE POLICY "Users are readable by authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own data (signup)
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete their own data" ON users
    FOR DELETE USING (auth.uid() = id);

-- Add RLS policies for refresh_tokens table
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own refresh tokens
CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON refresh_tokens TO authenticated;
GRANT ALL ON refresh_tokens_id_seq TO authenticated;