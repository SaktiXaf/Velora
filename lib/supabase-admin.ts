import { createClient } from '@supabase/supabase-js';

// Regular client for normal operations (uses anon key)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for admin operations (would use service role key in production)
// For now, we'll use the same client but handle RLS differently
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// In production, you would use:
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
