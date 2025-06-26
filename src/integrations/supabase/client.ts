// ESM-compatible conditional export for Supabase client
// Vite/browser: always use client.browser
// Node (tests): use client.node

let supabase: any;

if (typeof window !== 'undefined') {
  // Browser: static import (Vite will tree-shake)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  supabase = (await import('./client.browser')).supabase;
} else {
  // Node: static import
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  supabase = (await import('./client.node')).supabase;
}

export { supabase };
