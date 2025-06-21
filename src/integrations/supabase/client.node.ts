import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rlfghipdzxfnwijsylac.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZmdoaXBkenhmbndpanN5bGFjIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDg0MjM1MjEsImV4cCI6MjA2Mzk5OTUyMX0.VWlXe8p_SRtgVeE6w3rs9McW5-kc2ooFxGh9ghuQ57c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined,
    persistSession: false,
    autoRefreshToken: true,
  }
});
