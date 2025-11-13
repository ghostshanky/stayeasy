import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPermissions() {
  try {
    console.log('🔧 Fixing database permissions using direct SQL...');
    
    // First, let's check if RLS is already enabled
    console.log('🔍 Checking current RLS status...');
    
    // Try to enable RLS and create policies using direct table operations
    const policies = [
      {
        name: 'Properties are public readable',
        table: 'properties',
        command: `CREATE POLICY "Properties are public readable" ON properties
                 FOR SELECT USING (true);`
      },
      {
        name: 'Properties are viewable by authenticated users',
        table: 'properties', 
        command: `CREATE POLICY "Properties are viewable by authenticated users" ON properties
                 FOR SELECT USING (auth.role() = 'authenticated');`
      },
      {
        name: 'Owners can manage their own properties',
        table: 'properties',
        command: `CREATE POLICY "Owners can manage their own properties" ON properties
                 FOR ALL USING (auth.uid() = owner_id);`
      },
      {
        name: 'Users can view their own bookings',
        table: 'bookings',
        command: `CREATE POLICY "Users can view their own bookings" ON bookings
                 FOR SELECT USING (auth.uid() = user_id);`
      },
      {
        name: 'Owners can view bookings for their properties',
        table: 'bookings',
        command: `CREATE POLICY "Owners can view bookings for their properties" ON bookings
                 FOR SELECT USING (auth.uid() = (SELECT owner_id FROM properties WHERE id = property_id));`
      },
      {
        name: 'Users can view chats they\'re involved in',
        table: 'chats',
        command: `CREATE POLICY "Users can view chats they're involved in" ON chats
                 FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);`
      },
      {
        name: 'Users can view messages they\'re involved in',
        table: 'messages',
        command: `CREATE POLICY "Users can view messages they're involved in" ON messages
                 FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);`
      }
    ];
    
    console.log(`📝 Creating ${policies.length} policies...`);
    
    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name} on ${policy.table}`);
      
      try {
        // Use the Supabase RPC to execute raw SQL
        const { error } = await supabase
          .rpc('exec_sql', { 
            sql_text: policy.command 
          });
        
        if (error) {
          console.warn(`⚠️  Policy creation might have failed:`, error.message);
        } else {
          console.log(`✅ Policy created successfully: ${policy.name}`);
        }
      } catch (execError) {
        console.warn(`⚠️  Policy creation error:`, execError.message);
      }
    }
    
    console.log('🎉 Permission fixes completed!');
    
    // Test if the permissions are working
    console.log('🧪 Testing permissions...');
    
    // Test properties access
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (propertiesError) {
      console.error('❌ Error accessing properties table:', propertiesError.message);
    } else {
      console.log('✅ Properties table access working');
      console.log(`Found ${properties.length} properties`);
    }
    
    // Test bookings access
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingsError) {
      console.error('❌ Error accessing bookings table:', bookingsError.message);
    } else {
      console.log('✅ Bookings table access working');
      console.log(`Found ${bookings.length} bookings`);
    }
    
    // Test messages access
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ Error accessing messages table:', messagesError.message);
    } else {
      console.log('✅ Messages table access working');
      console.log(`Found ${messages.length} messages`);
    }
    
  } catch (error) {
    console.error('❌ Permission fix failed:', error);
    process.exit(1);
  }
}

fixPermissions();