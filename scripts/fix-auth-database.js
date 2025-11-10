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

async function fixDatabasePermissions() {
  console.log('🔧 [Fix Auth Database] Starting database permission fixes...');
  
  try {
    // Enable RLS on all relevant tables
    console.log('🔧 [Fix Auth Database] Enabling RLS on users table...');
    const { error: usersRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (usersRlsError) {
      console.log('⚠️ [Fix Auth Database] Users table RLS might already be enabled or error occurred:', usersRlsError.message);
    } else {
      console.log('✅ [Fix Auth Database] Users table RLS enabled');
    }

    // Create RLS policies for users table
    console.log('🔧 [Fix Auth Database] Creating RLS policies for users table...');
    
    // Policy to allow service role to read all users
    const { error: serviceRoleReadPolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can read all users" ON users
            FOR ALL USING (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (serviceRoleReadPolicyError) {
      console.log('⚠️ [Fix Auth Database] Service role read policy error:', serviceRoleReadPolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Service role read policy created');
    }

    // Policy to allow service role to insert users
    const { error: serviceRoleInsertPolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can insert users" ON users
            FOR INSERT WITH CHECK (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (serviceRoleInsertPolicyError) {
      console.log('⚠️ [Fix Auth Database] Service role insert policy error:', serviceRoleInsertPolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Service role insert policy created');
    }

    // Policy to allow service role to update users
    const { error: serviceRoleUpdatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can update users" ON users
            FOR UPDATE USING (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (serviceRoleUpdatePolicyError) {
      console.log('⚠️ [Fix Auth Database] Service role update policy error:', serviceRoleUpdatePolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Service role update policy created');
    }

    // Policy to allow service role to delete users
    const { error: serviceRoleDeletePolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can delete users" ON users
            FOR DELETE USING (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (serviceRoleDeletePolicyError) {
      console.log('⚠️ [Fix Auth Database] Service role delete policy error:', serviceRoleDeletePolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Service role delete policy created');
    }

    // Enable RLS on sessions table
    console.log('🔧 [Fix Auth Database] Enabling RLS on sessions table...');
    const { error: sessionsRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;'
    });
    
    if (sessionsRlsError) {
      console.log('⚠️ [Fix Auth Database] Sessions table RLS might already be enabled or error occurred:', sessionsRlsError.message);
    } else {
      console.log('✅ [Fix Auth Database] Sessions table RLS enabled');
    }

    // Create RLS policies for sessions table
    console.log('🔧 [Fix Auth Database] Creating RLS policies for sessions table...');
    
    const { error: sessionsServiceRolePolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can manage sessions" ON sessions
            FOR ALL USING (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (sessionsServiceRolePolicyError) {
      console.log('⚠️ [Fix Auth Database] Sessions service role policy error:', sessionsServiceRolePolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Sessions service role policy created');
    }

    // Enable RLS on audit_logs table
    console.log('🔧 [Fix Auth Database] Enabling RLS on audit_logs table...');
    const { error: auditLogsRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;'
    });
    
    if (auditLogsRlsError) {
      console.log('⚠️ [Fix Auth Database] Audit logs table RLS might already be enabled or error occurred:', auditLogsRlsError.message);
    } else {
      console.log('✅ [Fix Auth Database] Audit logs table RLS enabled');
    }

    // Create RLS policies for audit_logs table
    console.log('🔧 [Fix Auth Database] Creating RLS policies for audit_logs table...');
    
    const { error: auditLogsServiceRolePolicyError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY IF NOT EXISTS "Service role can manage audit logs" ON audit_logs
            FOR ALL USING (
              auth.jwt() ->> 'role' = 'service_role'
            );`
    });
    
    if (auditLogsServiceRolePolicyError) {
      console.log('⚠️ [Fix Auth Database] Audit logs service role policy error:', auditLogsServiceRolePolicyError.message);
    } else {
      console.log('✅ [Fix Auth Database] Audit logs service role policy created');
    }

    console.log('🎉 [Fix Auth Database] Database permission fixes completed!');
    console.log('🔧 [Fix Auth Database] Please restart your server for the changes to take effect.');
    
  } catch (error) {
    console.error('❌ [Fix Auth Database] Error fixing database permissions:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabasePermissions();