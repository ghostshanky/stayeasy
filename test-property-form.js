import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPropertyCreation() {
  try {
    console.log('🧪 Testing property creation functionality...');
    
    // Test with mock data mode enabled - disable Supabase completely
    process.env.MOCK_AUTH = 'true';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    
    const testProperty = {
      title: 'Test Property',
      description: 'A test property for validation',
      location: '123 Test Street, Test City',
      price_per_night: 100,
      ownerId: 'cmhrcwwuf000bq0i8f6nbkb4w'
    };

    console.log('📝 Creating test property...');
    
    const { data, error } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();

    if (error) {
      console.error('❌ Error creating property:', error);
      return;
    }

    console.log('✅ Property created successfully:', data[0]);
    
    // Clean up - delete the test property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', data[0].id);

    if (deleteError) {
      console.error('⚠️ Error cleaning up test property:', deleteError);
    } else {
      console.log('🧹 Test property cleaned up successfully');
    }

    console.log('🎉 Property creation test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    process.exit(1);
  }
}

// Run the test
testPropertyCreation().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});