import { createClient } from '@supabase/supabase-js';

// Resolve environment variables supporting both Node.js (scripts/server) and Vite browser context
if (typeof process !== 'undefined' && process.env) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (e) {}
}

const supabaseUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                    (import.meta.env?.VITE_SUPABASE_URL) ||
                    "";

const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                        (import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
                        "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing configuration. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
