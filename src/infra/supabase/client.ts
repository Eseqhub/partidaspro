import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('AQUI')) {
  console.warn('⚠️ Supabase credentials NOT CONFIGURED. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
