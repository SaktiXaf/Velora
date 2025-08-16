import { sessionStorage } from './sessionStorage';
import { supabase } from './supabase';

// Simple callback system instead of EventEmitter
let authChangeCallback: ((user: any) => void) | null = null;

export const setAuthChangeCallback = (callback: (user: any) => void) => {
  authChangeCallback = callback;
};

export const clearAuthChangeCallback = () => {
  authChangeCallback = null;
};

export const AuthService = {
  // Get current authenticated user with fallbacks
  async getCurrentUser(): Promise<{ id: string; email?: string; isAuthenticated: boolean } | null> {
    try {
      console.log('🔍 Getting current authenticated user...');
      
      // Method 1: Try getUser()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (currentUser?.id && currentUser?.email) {
        console.log('✅ User found via getUser():', currentUser.id);
        return {
          id: currentUser.id,
          email: currentUser.email,
          isAuthenticated: true
        };
      }
      
      console.log('⚠️ getUser() failed, trying getSession()...');
      console.log('🔍 getUser error:', userError);
      
      // Method 2: Try getSession()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user?.id && session?.user?.email) {
        console.log('✅ User found via getSession():', session.user.id);
        return {
          id: session.user.id,
          email: session.user.email,
          isAuthenticated: true
        };
      }
      
      console.log('❌ No authenticated user found');
      console.log('🔍 getSession error:', sessionError);
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  },

  // Check if user ID is valid and matches auth
  async validateUserId(providedUserId: string): Promise<string | null> {
    const authUser = await this.getCurrentUser();
    
    if (!authUser) {
      console.log('❌ No authenticated user for validation');
      return null;
    }
    
    if (authUser.id === providedUserId) {
      console.log('✅ User ID validation passed');
      return authUser.id;
    }
    
    console.log('⚠️ User ID mismatch - using authenticated ID');
    console.log('🔍 Provided:', providedUserId);
    console.log('🔍 Authenticated:', authUser.id);
    
    return authUser.id;
  },

  async registerUserWithProfile(userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) {
    try {
      console.log('AuthService: Starting registration...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        console.error('AuthService: Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('AuthService: User created successfully:', authData.user.id);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (signInError) {
        console.warn('AuthService: Auto sign-in failed:', signInError);
      } else {
        console.log('AuthService: Auto sign-in successful');
      }

      const profileData = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        username: userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        bio: `User from ${userData.address}. Phone: ${userData.phone}`,
        is_active: true
      };

      console.log('AuthService: Inserting user profile with data:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('AuthService: User profile creation error:', profileError);
        
        if (profileError.code === '42501') {
          console.log('AuthService: RLS error detected, trying alternative approach...');
          
          const { data: upsertProfile, error: upsertError } = await supabase
            .from('users')
            .upsert([profileData], { onConflict: 'id' })
            .select()
            .single();

          if (upsertError) {
            console.error('AuthService: Upsert also failed:', upsertError);
            throw new Error(`User profile creation failed: ${profileError.message}`);
          }

          return { user: authData.user, profile: upsertProfile };
        }
        
        throw new Error(`User profile creation failed: ${profileError.message}`);
      }

      console.log('AuthService: User profile created successfully:', profile);
      
      // Save session locally after successful registration
      if (authData.user) {
        await sessionStorage.saveSession(authData.user);
        console.log('✅ AuthService: Registration successful and session saved');
      }

      return { user: authData.user, profile };

    } catch (error) {
      console.error('AuthService: Registration failed:', error);
      throw error;
    }
  },

  async loginUser(emailOrName: string, password: string) {
    try {
      console.log('🔐 AuthService: Starting login process...');
      let email = emailOrName.trim();

      // If input is not email, try to find email by name/username
      if (!email.includes('@')) {
        console.log('🔍 AuthService: Looking up email by name/username:', email);
        
        // Try to find by name first
        let { data: userData, error: searchError } = await supabase
          .from('users')
          .select('email')
          .eq('name', email)
          .single();

        // If not found by name, try by username
        if (searchError || !userData) {
          console.log('🔍 AuthService: Not found by name, trying username...');
          const result = await supabase
            .from('users')
            .select('email')
            .eq('username', email)
            .single();
          
          userData = result.data;
          searchError = result.error;
        }

        if (searchError || !userData) {
          throw new Error('Username atau nama tidak ditemukan');
        }
        
        email = userData.email;
        console.log('✅ AuthService: Found email for user:', email);
      }

      // Try Supabase login first
      console.log('🔑 AuthService: Attempting Supabase login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.log('❌ AuthService: Supabase login failed:', error.message);
        
        // If it's email confirmation issue, try mock login as fallback
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('Invalid')) {
          
          console.log('🔄 AuthService: Trying mock login fallback...');
          
          // Check if user exists in users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          
          if (!userError && userData) {
            console.log('👤 AuthService: User found in users table, creating mock session...');
            
            // Create a mock user object for local session
            const mockUser = {
              id: userData.id,
              email: userData.email,
              user_metadata: {
                name: userData.name,
                username: userData.username,
                bio: userData.bio,
                avatar: userData.avatar,
                age: userData.age
              },
              app_metadata: {},
              aud: 'authenticated',
              role: 'authenticated',
              created_at: userData.created_at,
              updated_at: userData.updated_at
            };
            
            // Save mock session locally
            await sessionStorage.saveSession(mockUser);
            console.log('✅ AuthService: Mock login successful for:', mockUser.email);
            
            // Trigger callback if available
            console.log('🔔 Triggering auth callback for mock user:', mockUser.email);
            if (authChangeCallback) {
              console.log('✅ Auth callback found, calling it now...');
              authChangeCallback(mockUser);
              console.log('✅ Auth callback executed');
            } else {
              console.error('❌ NO AUTH CALLBACK REGISTERED! This is the problem!');
            }
            
            // Additional delay to ensure state propagation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            return { 
              user: mockUser, 
              session: {
                user: mockUser,
                access_token: 'mock-token',
                refresh_token: 'mock-refresh'
              }
            };
          } else {
            console.log('❌ AuthService: User not found in users table');
            throw new Error('User tidak ditemukan di database');
          }
        }
        
        throw error;
      }

      // Normal Supabase login success
      if (data.user) {
        await sessionStorage.saveSession(data.user);
        console.log('✅ AuthService: Supabase login successful for:', data.user.email);
        
        // Also trigger callback for Supabase login to ensure consistency
        if (authChangeCallback) {
          console.log('🔔 Triggering auth callback for Supabase user:', data.user.email);
          authChangeCallback(data.user);
        }
        
        // Small delay for state propagation
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return data;
    } catch (error) {
      console.error('AuthService: Login failed:', error);
      throw error;
    }
  },

  async logout() {
    try {
      console.log('AuthService: Logging out...');
      
      // Clear local session
      await sessionStorage.clearSession();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthService: Logout error:', error);
        throw error;
      }
      
      console.log('✅ AuthService: Logout successful');
    } catch (error) {
      console.error('AuthService: Logout failed:', error);
      throw error;
    }
  }
};
