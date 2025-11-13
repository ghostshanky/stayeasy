const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check if Supabase credentials are available
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('🧪 Testing authentication fix...');

async function testAuthentication() {
  try {
    // Test 1: Check if users table has required columns
    console.log('\n📋 Test 1: Checking users table schema...');
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
      return false;
    }
    
    if (usersData && usersData.length > 0) {
      const user = usersData[0];
      const requiredColumns = ['email_verified', 'email_token', 'email_token_expiry'];
      const missingColumns = requiredColumns.filter(col => !(col in user));
      
      if (missingColumns.length > 0) {
        console.error('❌ Missing columns in users table:', missingColumns);
        return false;
      }
      
      console.log('✅ Users table has all required columns');
      console.log('📊 Available columns:', Object.keys(user));
    }
    
    // Test 2: Try to create a test user
    console.log('\n👤 Test 2: Creating test user...');
    
    const testUser = {
      id: crypto.randomUUID(),
      email: 'test@example.com',
      password: 'hashed_password_placeholder',
      name: 'Test User',
      role: 'TENANT',
      email_verified: false,
      email_token: 'test_token',
      email_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (createUserError) {
      console.error('❌ Error creating test user:', createUserError.message);
      return false;
    }
    
    console.log('✅ Test user created successfully:', newUser.id);
    
    // Test 3: Try to fetch the user
    console.log('\n🔍 Test 3: Fetching test user...');
    
    const { data: fetchedUser, error: fetchUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single();
    
    if (fetchUserError) {
      console.error('❌ Error fetching test user:', fetchUserError.message);
      return false;
    }
    
    console.log('✅ Test user fetched successfully');
    
    // Test 4: Try to update the user
    console.log('\n✏️  Test 4: Updating test user...');
    
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', newUser.id);
    
    if (updateUserError) {
      console.error('❌ Error updating test user:', updateUserError.message);
      return false;
    }
    
    console.log('✅ Test user updated successfully');
    
    // Test 5: Clean up - delete the test user
    console.log('\n🗑️  Test 5: Cleaning up test user...');
    
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);
    
    if (deleteUserError) {
      console.error('❌ Error deleting test user:', deleteUserError.message);
      return false;
    }
    
    console.log('✅ Test user deleted successfully');
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('🔐 Your authentication system should now work properly.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    return false;
  }
}

// Run the tests
testAuthentication().then(success => {
  if (success) {
    console.log('\n✅ Authentication fix verification completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Authentication fix verification failed!');
    console.log('Please run the fix script again and check the error messages.');
    process.exit(1);
  }
});