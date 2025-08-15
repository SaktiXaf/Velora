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
    console.log('🔍 Testing Supabase connection...');
    
    // Test connection using the users table
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network connection failed' 
    };
  }
};

// New function specifically to test users table
export const testUsersTable = async (): Promise<{ success: boolean, error?: string, tableExists?: boolean }> => {
  try {
    console.log('🔍 Testing users table accessibility...');
    
    // Try to get count of users table
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Users table test failed:', error);
      
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { 
          success: false, 
          tableExists: false,
          error: 'Users table does not exist in database' 
        };
      }
      
      return { 
        success: false, 
        tableExists: true,
        error: error.message 
      };
    }
    
    console.log(`✅ Users table accessible with ${count} records`);
    return { 
      success: true, 
      tableExists: true 
    };
  } catch (error) {
    console.error('❌ Users table test error:', error);
    return { 
      success: false, 
      tableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error testing users table' 
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
