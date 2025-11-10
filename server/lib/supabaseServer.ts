import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key for full access
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

// Add validation to ensure we have proper credentials
if (supabaseUrl === 'https://your-project.supabase.co' || supabaseServiceRoleKey === 'your-service-role-key') {
  console.warn('⚠️  WARNING: Using default Supabase server placeholder values.')
  console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.')
  console.warn('   Server-side database operations will not work properly.')
} else {
  console.log('✅ Supabase credentials loaded successfully')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})