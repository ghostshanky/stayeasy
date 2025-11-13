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

async function setupStorageBucket() {
  try {
    console.log('🚀 Setting up Supabase storage bucket for property images...');

    // Create storage bucket for property images
    const { data, error } = await supabase.storage.createBucket('property-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      if (error.code === '42P10') {
        console.log('✅ Storage bucket "property-images" already exists.');
      } else {
        console.error('❌ Error creating storage bucket:', error);
        return;
      }
    } else {
      console.log('✅ Storage bucket "property-images" created successfully.');
    }

    // Set up RLS policies for the storage bucket
    console.log('🔒 Setting up RLS policies for storage bucket...');

    // Policy to allow authenticated users to upload files
    const { error: uploadPolicyError } = await supabase.rpc('storage_create_bucket_policy', {
      bucket_name: 'property-images',
      policy_name: 'authenticated-users-can-upload',
      policy_definition: `bucket_id = 'property-images';
        policy = 'INSERT';
        roles = 'authenticated';
        check = (bucket_id = 'property-images');`
    });

    if (uploadPolicyError && !uploadPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating upload policy:', uploadPolicyError);
    } else {
      console.log('✅ Upload policy created/verified.');
    }

    // Policy to allow public read access
    const { error: readPolicyError } = await supabase.rpc('storage_create_bucket_policy', {
      bucket_name: 'property-images',
      policy_name: 'public-can-read',
      policy_definition: `bucket_id = 'property-images';
        policy = 'SELECT';
        roles = 'public';
        check = (bucket_id = 'property-images');`
    });

    if (readPolicyError && !readPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating read policy:', readPolicyError);
    } else {
      console.log('✅ Read policy created/verified.');
    }

    console.log('🎉 Storage bucket setup completed successfully!');
    console.log('📁 Property images will be stored in: property-images/');

  } catch (error) {
    console.error('❌ Unexpected error during storage setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupStorageBucket().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});