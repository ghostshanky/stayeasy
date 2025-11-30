-- Create Owner Entry for Existing User
-- This script creates an owner record for the existing user

-- First, let's verify the user exists
SELECT id, email, name, role FROM users WHERE id = '1540765b-aa8b-47d1-8030-77eb00024431';

-- Insert the user into the owners table
INSERT INTO owners (id, email, password, name, created_at, updated_at)
SELECT 
    id, 
    email, 
    password, 
    name, 
    created_at, 
    updated_at
FROM users 
WHERE id = '1540765b-aa8b-47d1-8030-77eb00024431';

-- Verify the owner was created
SELECT id, email, name, created_at FROM owners WHERE id = '1540765b-aa8b-47d1-8030-77eb00024431';

-- Display success message
SELECT '✅ Owner entry created successfully!' as status;
SELECT '👤 User testuser@gmail.com is now set up as an owner' as owner_info;
SELECT '🏠 Properties can now be created for this owner' as capability;