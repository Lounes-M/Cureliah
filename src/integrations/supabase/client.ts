// Conditional export for Supabase client: browser vs node
let supabase;
if (typeof window !== 'undefined') {
  supabase = require('./client.browser').supabase;
} else {
  supabase = require('./client.node').supabase;
}

export { supabase };
