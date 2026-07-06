import { createClient } from '@supabase/supabase-js';

const fallbackUrl = "https://wivioicznwyhmpbeqoib.supabase.co";
const fallbackKey = "sb_publishable_BDs07J3DlUgYfFz6X-8qFw_JKf7zJsa";

const isDemoEnv = (import.meta.env?.VITE_DEMO_MODE !== 'false');

const supabaseUrl = (typeof window !== 'undefined' && (window as any).VITE_SUPABASE_URL) ||
                    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                    (import.meta.env?.VITE_SUPABASE_URL) ||
                    "";

const supabaseAnonKey = (typeof window !== 'undefined' && (window as any).VITE_SUPABASE_ANON_KEY) ||
                        (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                        (import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
                        "";

const finalUrl = supabaseUrl || (isDemoEnv ? fallbackUrl : "");
const finalKey = supabaseAnonKey || (isDemoEnv ? fallbackKey : "");

if (!isDemoEnv) {
  if (!finalUrl || !finalKey || finalUrl === fallbackUrl || finalKey === fallbackKey) {
    throw new Error('[Supabase] Running on Production mode but missing or using fallback demo credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY correctly in your production environment.');
  }
} else if (!finalUrl || !finalKey) {
  console.warn('[Supabase] Missing configuration. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(finalUrl, finalKey);
