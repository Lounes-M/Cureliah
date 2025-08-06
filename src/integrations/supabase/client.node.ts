import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Ensure we have valid credentials (unless in test environment)
if (!isTestEnvironment && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

// Use mock values for testing
const finalUrl = supabaseUrl || 'https://test.supabase.co';
const finalKey = supabaseAnonKey || 'test-anon-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: undefined,
    persistSession: false,
    autoRefreshToken: !isTestEnvironment,
  }
});
