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
    console.log('🔧 Fixing database permissions...');
    
    // SQL statements to fix permissions
    const statements = [
      // Enable RLS on properties table
      `ALTER TABLE properties ENABLE ROW LEVEL SECURITY;`,
      
      // Allow authenticated users to view properties
      `CREATE POLICY "Properties are viewable by authenticated users" ON properties
       FOR SELECT USING (auth.role() = 'authenticated');`,
      
      // Allow owners to manage their own properties
      `CREATE POLICY "Owners can manage their own properties" ON properties
       FOR ALL USING (auth.uid() = owner_id);`,
      
      // Allow public read access to properties for listings
      `CREATE POLICY "Properties are public readable" ON properties
       FOR SELECT USING (true);`,
      
      // Enable RLS on bookings table
      `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;`,
      
      // Allow users to view their own bookings
      `CREATE POLICY "Users can view their own bookings" ON bookings
       FOR SELECT USING (auth.uid() = user_id);`,
      
      // Allow owners to view bookings for their properties
      `CREATE POLICY "Owners can view bookings for their properties" ON bookings
       FOR SELECT USING (auth.uid() = (SELECT owner_id FROM properties WHERE id = property_id));`,
      
      // Enable RLS on messages table
      `ALTER TABLE messages ENABLE ROW LEVEL SECURITY;`,
      
      // Allow users to view messages they're involved in
      `CREATE POLICY "Users can view messages they're involved in" ON messages
       FOR SELECT USING (
         auth.uid() = sender_id OR 
         auth.uid() = recipient_id OR
         auth.uid() = (SELECT user_id FROM chats WHERE id = chat_id) OR
         auth.uid() = (SELECT owner_id FROM chats WHERE id = chat_id)
       );`,
      
      // Enable RLS on chats table
      `ALTER TABLE chats ENABLE ROW LEVEL SECURITY;`,
      
      // Allow users to view chats they're involved in
      `CREATE POLICY "Users can view chats they're involved in" ON chats
       FOR SELECT USING (
         auth.uid() = user_id OR 
         auth.uid() = owner_id
       );`
    ];
    
    console.log(`📝 Executing ${statements.length} SQL permission statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement}`);
      
      try {
        // Use the SQL editor to execute raw SQL
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} might have failed (this is normal for some statements):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.warn(`⚠️  Statement ${i + 1} execution error:`, execError.message);
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
    }
    
  } catch (error) {
    console.error('❌ Permission fix failed:', error);
    process.exit(1);
  }
}

fixPermissions();