
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting users table...');
    // We can't easily get table schema via JS client without admin API or querying information_schema (which might be restricted)
    // But we can try to select a non-existent column and see the error, or select * limit 1 and see keys

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('User columns:', Object.keys(data[0]));
        if (Object.keys(data[0]).includes('image_id')) {
            console.log('✅ image_id column exists');
        } else {
            console.log('❌ image_id column MISSING');
        }
    } else {
        console.log('No users found to inspect columns. Trying to insert dummy to check schema if possible, or just assuming.');
        // If no users, we can't check columns easily this way. 
        // Let's try to select 'image_id' specifically
        const { error: colError } = await supabase.from('users').select('image_id').limit(1);
        if (colError) {
            console.log('❌ Error selecting image_id (likely missing):', colError.message);
        } else {
            console.log('✅ image_id column selection successful (it exists)');
        }
    }
}

inspectTable();
