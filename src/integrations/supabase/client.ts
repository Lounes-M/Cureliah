
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rlfghipdzxfnwijsylac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZmdoaXBkenhmbndpanN5bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjM1MjEsImV4cCI6MjA2Mzk5OTUyMX0.VWlXe8p_SRtgVeE6w3rs9McW5-kc2ooFxGh9ghuQ57c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
