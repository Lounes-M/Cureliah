import { supabase as browserClient } from './client.browser';
import { supabase as nodeClient } from './client.node';

const supabase = typeof window !== 'undefined' ? browserClient : nodeClient;

export { supabase };
