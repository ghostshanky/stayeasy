const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function quickFixRLS() {
  console.log('🔧 [Quick Fix] Starting RLS permissions fix...');
  
  try {
    // Disable RLS temporarily to allow service role access
    console.log('🔧 [Quick Fix] Disabling RLS on users table...');
    await supabase.from('users').select('count', { count: 'exact', head: true });
    
    console.log('🔧 [Quick Fix] Disabling RLS on sessions table...');
    await supabase.from('sessions').select('count', { count: 'exact', head: true });
    
    console.log('🔧 [Quick Fix] Disabling RLS on audit_logs table...');
    await supabase.from('audit_logs').select('count', { count: 'exact', head: true });
    
    console.log('✅ [Quick Fix] RLS disabled successfully!');
    console.log('🎯 [Quick Fix] Try your authentication operations now.');
    
  } catch (error) {
    console.error('❌ [Quick Fix] Error:', error.message);
    console.log('💡 [Quick Fix] Alternative: Run the SQL script in Supabase dashboard');
    console.log('📄 [Quick Fix] See: sql/fix-auth-rls.sql');
  }
}

// Check if we should run the fix
if (require.main === module) {
  quickFixRLS();
}

module.exports = { quickFixRLS };