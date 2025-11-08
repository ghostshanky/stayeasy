import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../lib/supabase';

// Client-side Supabase client using anon key for public operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);