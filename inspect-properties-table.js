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

async function inspectPropertiesTable() {
  try {
    console.log('🔍 Inspecting properties table structure...');
    
    // Try to get a sample record to see the columns
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing properties table:', error);
      
      // Try to get the table information from information_schema
      const { data: tableInfo, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'properties');

      if (schemaError) {
        console.error('❌ Error getting table schema:', schemaError);
        return;
      }

      console.log('📋 Properties table columns:');
      tableInfo.forEach(column => {
        console.log(`  - ${column.column_name} (${column.data_type}) [${column.is_nullable}]`);
      });
      
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Properties table sample record:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n📋 Available columns:');
      Object.keys(data[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof data[0][column]}`);
      });
    } else {
      console.log('⚠️ No records found in properties table');
    }

  } catch (error) {
    console.error('❌ Unexpected error during inspection:', error);
    process.exit(1);
  }
}

// Run the inspection
inspectPropertiesTable().catch(error => {
  console.error('❌ Inspection failed:', error);
  process.exit(1);
});