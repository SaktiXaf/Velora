import { createClient } from '@supabase/supabase-js';

// Supabase config with your project details
const supabaseUrl = 'https://ceakczkuflaawjpgyjst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYWtjemt1ZmxhYXdqcGd5anN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDYzNjcsImV4cCI6MjA2OTIyMjM2N30.01495ERM9vPJ4DODziTs6XUo5QfWhj0NUNHUFerBYGI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const testSupabaseConnection = async (): Promise<{ success: boolean, error?: string }> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network connection failed' 
    };
  }
};

export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
  age?: number;
  avatar?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'run' | 'bike' | 'walk';
  distance: number;
  duration: number;
  date: string;
  created_at: string;
}
