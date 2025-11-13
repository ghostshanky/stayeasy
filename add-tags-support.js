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

async function addTagsSupport() {
  try {
    console.log('🚀 Adding tags support to properties table...');

    // Check if tags column already exists
    const { data: columns, error: columnsError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('❌ Error checking properties table:', columnsError);
      return;
    }

    // Try to add tags column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec', {
      query: `
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'
      `
    });

    if (alterError) {
      if (alterError.message.includes('already exists') || alterError.message.includes('duplicate column')) {
        console.log('✅ Tags column already exists in properties table.');
      } else {
        console.error('❌ Error adding tags column:', alterError);
        return;
      }
    } else {
      console.log('✅ Tags column added to properties table successfully.');
    }

    // Create index on tags for better search performance
    const { error: indexError } = await supabase.rpc('exec', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_properties_tags 
        ON properties USING GIN(tags)
      `
    });

    if (indexError) {
      console.error('❌ Error creating tags index:', indexError);
    } else {
      console.log('✅ Tags index created successfully.');
    }

    console.log('🎉 Tags support added successfully!');
    console.log('📝 Properties can now store tags as an array of strings.');

  } catch (error) {
    console.error('❌ Unexpected error during tags setup:', error);
    process.exit(1);
  }
}

// Run the setup
addTagsSupport().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});