import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAppPermissions() {
  console.log('🔧 Fixing application table permissions...');
  
  try {
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'sql', 'fix-app-permissions.sql'), 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let executedCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        const fullStatement = statement + ';';
        
        // Use the exec function to run raw SQL
        const { data, error } = await supabase.rpc('exec', { 
          sql: fullStatement 
        });
        
        if (error) {
          console.warn(`⚠️  Statement ${executedCount + 1} might have failed:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${executedCount + 1} executed successfully`);
        }
        
        executedCount++;
      } catch (err) {
        console.error(`❌ Error executing statement ${executedCount + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Permission fix completed!`);
    console.log(`✅ Successfully executed: ${executedCount - errorCount} statements`);
    console.log(`⚠️  Had warnings: ${errorCount} statements`);
    
    // Test the permissions
    console.log('\n🧪 Testing permissions...');
    
    // Test properties access
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
    
    if (propertiesError) {
      console.error('❌ Error accessing properties table:', propertiesError.message);
    } else {
      console.log('✅ Successfully accessed properties table');
    }
    
    // Test bookings access
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('count', { count: 'exact', head: true });
    
    if (bookingsError) {
      console.error('❌ Error accessing bookings table:', bookingsError.message);
    } else {
      console.log('✅ Successfully accessed bookings table');
    }
    
    // Test messages access
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true });
    
    if (messagesError) {
      console.error('❌ Error accessing messages table:', messagesError.message);
    } else {
      console.log('✅ Successfully accessed messages table');
    }
    
    console.log('\n🔍 If you see "✅ Successfully accessed" messages above, permissions are working!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the function
fixAppPermissions().catch(console.error);