import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration status in development
if (import.meta.env.DEV) {
  console.log('� Supabase Configuration:', {
    url: supabaseUrl,
    hasValidCredentials: !!(supabaseUrl && supabaseAnonKey),
    isProduction: true
  });
}

// Ensure we have valid credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
