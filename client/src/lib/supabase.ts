import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../lib/supabase'

// Client-side Supabase client using anon key for public operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Add validation to ensure we have proper credentials
if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.warn('⚠️  WARNING: Using default Supabase client placeholder values.')
  console.warn('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
  console.warn('   Client-side database operations will not work properly.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
