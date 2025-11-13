import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Hardcoded credentials for testing (in production, use environment variables)
const supabaseUrl = 'https://cmhrcwwuf000bq0i8f6nbkb4w.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtaHJjd3d1ZjAwYnEwaThmNm5iYzJiNCIsInJvbGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjYxNjM5NDksImV4cCI6Yx8_'; // Replace with your actual service role key

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPermissions() {
  console.log('🔧 Fixing database permissions using individual table operations...');
  
  try {
    // Enable RLS on all tables
    console.log('📝 Enabling Row Level Security...');
    
    const tables = ['properties', 'bookings', 'messages', 'chats', 'payments', 'reviews'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });
        
        if (error) {
          console.warn(`⚠️  Could not enable RLS on ${table}:`, error.message);
        } else {
          console.log(`✅ RLS enabled on ${table}`);
        }
      } catch (err) {
        console.warn(`⚠️  Error enabling RLS on ${table}:`, err.message);
      }
    }
    
    // Create individual policies for each table
    console.log('\n📝 Creating policies...');
    
    // Properties policies
    try {
      await supabase.rpc('exec', {
        sql: `CREATE POLICY IF NOT EXISTS "Public can read properties" ON properties
              FOR SELECT USING (true);`
      });
      console.log('✅ Properties read policy created');
    } catch (err) {
      console.warn('⚠️  Properties policy creation failed:', err.message);
    }
    
    try {
      await supabase.rpc('exec', {
        sql: `CREATE POLICY IF NOT EXISTS "Owners can manage their properties" ON properties
              FOR ALL USING (auth.uid()::text = owner_id);`
      });
      console.log('✅ Properties management policy created');
    } catch (err) {
      console.warn('⚠️  Properties management policy failed:', err.message);
    }
    
    // Bookings policies
    try {
      await supabase.rpc('exec', {
        sql: `CREATE POLICY IF NOT EXISTS "Users can view their bookings" ON bookings
              FOR SELECT USING (auth.uid()::text = user_id);`
      });
      console.log('✅ Bookings view policy created');
    } catch (err) {
      console.warn('⚠️  Bookings view policy failed:', err.message);
    }
    
    // Messages policies
    try {
      await supabase.rpc('exec', {
        sql: `CREATE POLICY IF NOT EXISTS "Users can view messages they're involved in" ON messages
              FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);`
      });
      console.log('✅ Messages view policy created');
    } catch (err) {
      console.warn('⚠️  Messages view policy failed:', err.message);
    }
    
    // Chats policies
    try {
      await supabase.rpc('exec', {
        sql: `CREATE POLICY IF NOT EXISTS "Users can view chats they're involved in" ON chats
              FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);`
      });
      console.log('✅ Chats view policy created');
    } catch (err) {
      console.warn('⚠️  Chats view policy failed:', err.message);
    }
    
    // Grant basic permissions
    console.log('\n📝 Granting basic permissions...');
    
    try {
      await supabase.rpc('exec', {
        sql: `GRANT SELECT ON properties TO authenticated;`
      });
      console.log('✅ SELECT granted on properties');
    } catch (err) {
      console.warn('⚠️  Grant SELECT on properties failed:', err.message);
    }
    
    try {
      await supabase.rpc('exec', {
        sql: `GRANT SELECT ON bookings TO authenticated;`
      });
      console.log('✅ SELECT granted on bookings');
    } catch (err) {
      console.warn('⚠️  Grant SELECT on bookings failed:', err.message);
    }
    
    try {
      await supabase.rpc('exec', {
        sql: `GRANT SELECT ON messages TO authenticated;`
      });
      console.log('✅ SELECT granted on messages');
    } catch (err) {
      console.warn('⚠️  Grant SELECT on messages failed:', err.message);
    }
    
    // Test the permissions
    console.log('\n🧪 Testing permissions...');
    
    // Test properties access
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error accessing properties:', error.message);
      } else {
        console.log('✅ Successfully accessed properties table');
      }
    } catch (err) {
      console.error('❌ Exception accessing properties:', err.message);
    }
    
    // Test bookings access
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error accessing bookings:', error.message);
      } else {
        console.log('✅ Successfully accessed bookings table');
      }
    } catch (err) {
      console.error('❌ Exception accessing bookings:', err.message);
    }
    
    // Test messages access
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error accessing messages:', error.message);
      } else {
        console.log('✅ Successfully accessed messages table');
      }
    } catch (err) {
      console.error('❌ Exception accessing messages:', err.message);
    }
    
    console.log('\n🎉 Permission fix process completed!');
    console.log('📝 Check the results above to see which operations succeeded.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the function
fixPermissions().catch(console.error);