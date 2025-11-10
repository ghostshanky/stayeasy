import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('🚀 Creating database tables...');
    
    // Create enums first
    console.log('Creating enums...');
    const enums = [
      'CREATE TYPE role AS ENUM (\'TENANT\', \'OWNER\', \'ADMIN\');',
      'CREATE TYPE booking_status AS ENUM (\'PENDING\', \'CONFIRMED\', \'CANCELLED\', \'COMPLETED\');',
      'CREATE TYPE payment_status AS ENUM (\'PENDING\', \'COMPLETED\', \'FAILED\');'
    ];
    
    for (const enumDef of enums) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: enumDef });
        if (error) {
          console.log('⚠️  Enum might already exist:', error.message);
        } else {
          console.log('✅ Enum created successfully');
        }
      } catch (err) {
        console.log('⚠️  Enum creation skipped (might already exist)');
      }
    }
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role role DEFAULT 'TENANT',
          bio TEXT,
          mobile VARCHAR(20),
          image_id VARCHAR(255),
          email_verified BOOLEAN DEFAULT FALSE,
          email_token VARCHAR(255),
          email_token_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (usersError) {
      console.log('⚠️  Users table creation error:', usersError.message);
    } else {
      console.log('✅ Users table created successfully');
    }
    
    // Create sessions table
    console.log('Creating sessions table...');
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `
    });
    
    if (sessionsError) {
      console.log('⚠️  Sessions table creation error:', sessionsError.message);
    } else {
      console.log('✅ Sessions table created successfully');
    }
    
    // Create properties table
    console.log('Creating properties table...');
    const { error: propertiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS properties (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          description TEXT,
          price_per_night DECIMAL(10,2) NOT NULL,
          images TEXT[] DEFAULT '{}',
          rating DECIMAL(3,2) DEFAULT 0,
          capacity INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `
    });
    
    if (propertiesError) {
      console.log('⚠️  Properties table creation error:', propertiesError.message);
    } else {
      console.log('✅ Properties table created successfully');
    }
    
    // Create bookings table
    console.log('Creating bookings table...');
    const { error: bookingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          property_id VARCHAR(255) NOT NULL,
          check_in TIMESTAMP NOT NULL,
          check_out TIMESTAMP NOT NULL,
          status booking_status DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        );
      `
    });
    
    if (bookingsError) {
      console.log('⚠️  Bookings table creation error:', bookingsError.message);
    } else {
      console.log('✅ Bookings table created successfully');
    }
    
    // Create payments table
    console.log('Creating payments table...');
    const { error: paymentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status payment_status DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        );
      `
    });
    
    if (paymentsError) {
      console.log('⚠️  Payments table creation error:', paymentsError.message);
    } else {
      console.log('✅ Payments table created successfully');
    }
    
    // Test if the users table exists
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking users table:', error.message);
    } else {
      console.log('✅ Users table exists and is accessible');
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

createTables();