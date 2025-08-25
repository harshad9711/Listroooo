import { createClient } from '@supabase/supabase-js';

// Load from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format
if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(`Invalid VITE_SUPABASE_URL: "${supabaseUrl}"`);
}
if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
