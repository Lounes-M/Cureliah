import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabase: SupabaseClient<Database>;
