import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Supabase URL and Anon Key are required environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);
