import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name?: string; // Changed from full_name to name
  age?: number;
  address?: string;
  bio?: string;
  profile_picture?: string; // Changed from avatar_url to profile_picture
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  /**
   * Create a new user profile in the database
   * Note: This should be called after successful Supabase auth signup when user has valid session
   */
  static async createUserProfile(userId: string, email: string, additionalData: Partial<UserProfile> = {}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log('👤 Creating user profile for:', email);
      
      const userData: Partial<UserProfile> = {
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      // First, try to get current session to ensure user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.warn('⚠️ No active session found, user profile creation may fail due to RLS');
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ User profile creation failed:', error);
        
        // If RLS error, provide helpful message
        if (error.code === '42501' || error.message.includes('row-level security')) {
          return { 
            success: false, 
            error: 'Authentication required for user profile creation. Please ensure user is signed in.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      console.log('✅ User profile created successfully:', data.email);
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ User profile creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user profile' 
      };
    }
  }

  /**
   * Get user profile from database
   */
  static async getUserProfile(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log('👤 Fetching user profile for ID:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 User profile not found, will need to create one');
          return { success: false, error: 'User profile not found' };
        }
        console.error('❌ User profile fetch failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User profile fetched:', data.email);
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ User profile fetch error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user profile' 
      };
    }
  }

  /**
   * Update user profile in database
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log('👤 Updating user profile for ID:', userId);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ User profile update failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User profile updated:', data.email);
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ User profile update error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user profile' 
      };
    }
  }

  /**
   * Check if user profile exists
   */
  static async userProfileExists(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ User profile existence check failed:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('❌ User profile existence check error:', error);
      return false;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log('👤 Fetching user by email:', email);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 User not found by email');
          return { success: false, error: 'User not found' };
        }
        console.error('❌ User fetch by email failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User fetched by email:', data.email);
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ User fetch by email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user by email' 
      };
    }
  }
}
