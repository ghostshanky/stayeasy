import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function fixDatabasePermissions() {
  console.log('🔧 Fixing database permissions...');
  
  try {
    // First, let's test if we can access the users table
    console.log('🧪 Testing users table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Cannot access users table:', usersError);
      
      // The issue is likely that the service role key doesn't have permissions
      // Let's try to create a user directly to see if we get more specific error
      console.log('🧪 Testing user creation...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'test123',
        email_confirm: true,
        user_metadata: {
          name: 'Test User'
        }
      });
      
      if (createError) {
        console.error('❌ User creation failed:', createError);
        
        // Check if the error is specifically about permissions
        if (createError.message.includes('permission denied')) {
          console.log('🔧 The issue is database permissions. You need to:');
          console.log('1. Go to your Supabase dashboard');
          console.log('2. Navigate to your project');
          console.log('3. Go to SQL Editor');
          console.log('4. Run the following SQL:');
          console.log('');
          console.log('-- Fix Service Role Permissions');
          console.log('-- Run this in your Supabase SQL Editor');
          console.log('');
          console.log('-- Drop existing policies');
          console.log('DROP POLICY IF EXISTS "Service role can access users" ON public.users;');
          console.log('DROP POLICY IF EXISTS "Public can read users" ON public.users;');
          console.log('DROP POLICY IF EXISTS "Authenticated can manage users" ON public.users;');
          console.log('');
          console.log('-- Disable RLS temporarily');
          console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
          console.log('');
          console.log('-- Grant permissions to service role');
          console.log('GRANT ALL ON public.users TO authenticated;');
          console.log('GRANT ALL ON public.users TO public;');
          console.log('');
          console.log('-- Create service role policy');
          console.log('CREATE POLICY "Service role can access users" ON public.users');
          console.log('    FOR ALL USING (');
          console.log('        auth.jwt() ->> \'role\' = \'service_role\'');
          console.log('    );');
          console.log('');
          console.log('-- Enable RLS back');
          console.log('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;');
          console.log('');
          console.log('-- Test the fix');
          console.log('SELECT COUNT(*) FROM public.users;');
          console.log('');
          console.log('After running this SQL, try the authentication again.');
        } else {
          console.error('❌ Different error:', createError);
        }
      } else {
        console.log('✅ User creation successful!');
        console.log('🎉 The database permissions are working correctly!');
      }
    } else {
      console.log('✅ Users table access successful!');
      console.log('🎉 Database permissions are already working!');
      console.log('Found users:', usersData.length);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

fixDatabasePermissions();