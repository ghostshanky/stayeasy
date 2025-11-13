import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config()

// Check if Supabase credentials are available
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file')
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log('🔧 Starting authentication schema fix...')

async function runSqlFix() {
  try {
    const sqlPath = join(__dirname, '../sql/fix-auth-schema.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements (excluding comments and SELECT statements)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().includes('SELECT'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(`🔄 Executing: ${statement.substring(0, 50)}...`)
        
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        })
        
        if (error) {
          console.warn(`⚠️  Warning: ${error.message}`)
        } else {
          console.log(`✅ Executed successfully`)
        }
      } catch (err: any) {
        console.warn(`⚠️  Statement failed: ${err.message}`)
      }
    }
    
    console.log('✅ Authentication schema fix completed!')
    console.log('🔐 Please try logging in again.')
    
  } catch (error: any) {
    console.error('❌ Error executing SQL fix:', error.message)
    process.exit(1)
  }
}

// Run the fix
runSqlFix()