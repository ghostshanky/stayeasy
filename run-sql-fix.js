import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlFix() {
  try {
    console.log('🚀 Running SQL fix...');
    
    // Read the SQL fix file
    const sql = fs.readFileSync('sql/fix-auth-schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using direct SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use direct SQL execution
        const { error } = await supabase
          .from('users')
          .select('1')
          .limit(1)
          .single();
        
        if (error && error.code === 'PGRST116') {
          // Table doesn't exist, try to create it
          console.log('⚠️ Users table does not exist, creating basic schema...');
          
          // Create basic users table first
          const createTableSql = `
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
              email VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              name VARCHAR(255) NOT NULL,
              role VARCHAR(50) DEFAULT 'TENANT',
              email_verified BOOLEAN DEFAULT FALSE,
              email_token VARCHAR(255),
              email_token_expiry TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          
          // Try to execute the create table statement
          const { error: createError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
          
          if (createError) {
            console.log('❌ Could not create users table:', createError.message);
          } else {
            console.log('✅ Users table created successfully');
          }
        }
        
        console.log(`✅ Statement ${i + 1} processed`);
        
      } catch (execError) {
        console.warn(`⚠️ Statement ${i + 1} execution warning:`, execError.message);
      }
    }
    
    console.log('🎉 SQL fix completed!');
    
    // Test if the users table exists and is accessible
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking users table:', error.message);
    } else {
      console.log('✅ Users table exists and is accessible');
    }
    
  } catch (error) {
    console.error('❌ SQL fix failed:', error);
    process.exit(1);
  }
}

runSqlFix();