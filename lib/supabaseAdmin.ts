import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ceakczk​uflaa​wjpgyjst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYWtjemt1ZmxhYXdqcGd5anN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDYzNjcsImV4cCI6MjA2OTIyMjM2N30.01495ERM9vPJ4DODziTs6XUo5QfWhj0NUNHUFerBYGI';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create an admin client for operations that need to bypass RLS
// Note: You need to get the service_role key from your Supabase dashboard
// For now, we'll use a function that temporarily disables RLS for profile creation
export const createProfile = async (profileData: any) => {
  try {
    // First, try with the regular client
    const { data, error } = await supabase
      .from('users')
      .insert([profileData])
      .select();

    if (error) {
      console.error('Profile creation error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createProfile:', error);
    throw error;
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
