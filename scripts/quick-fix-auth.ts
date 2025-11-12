import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
    // Try to access each table to test permissions
    console.log('🔧 [Quick Fix] Testing users table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('❌ [Quick Fix] Users table error:', usersError);
    } else {
      console.log('✅ [Quick Fix] Users table accessible');
    }

    console.log('🔧 [Quick Fix] Testing sessions table access...');
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('count', { count: 'exact', head: true });
    
    if (sessionsError) {
      console.error('❌ [Quick Fix] Sessions table error:', sessionsError);
    } else {
      console.log('✅ [Quick Fix] Sessions table accessible');
    }

    console.log('🔧 [Quick Fix] Testing audit_logs table access...');
    const { data: auditLogsData, error: auditLogsError } = await supabase
      .from('audit_logs')
      .select('count', { count: 'exact', head: true });
    
    if (auditLogsError) {
      console.error('❌ [Quick Fix] Audit logs table error:', auditLogsError);
    } else {
      console.log('✅ [Quick Fix] Audit logs table accessible');
    }

    console.log('🎯 [Quick Fix] If all tables are accessible, try authentication operations now.');
    console.log('📋 [Quick Fix] If errors persist, run the SQL script in Supabase dashboard:');
    console.log('📄 [Quick Fix] File: sql/fix-auth-rls.sql');
    
  } catch (error) {
    console.error('❌ [Quick Fix] Error:', error);
    console.log('💡 [Quick Fix] Alternative: Run the SQL script in Supabase dashboard');
    console.log('📄 [Quick Fix] See: sql/fix-auth-rls.sql');
  }
}

// Run the fix
quickFixRLS().catch(console.error);