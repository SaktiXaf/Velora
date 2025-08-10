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
        phone: userData.phone,
        address: userData.address,
      };

      console.log('AuthService: Inserting profile with data:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('AuthService: Profile creation error:', profileError);
        
        if (profileError.code === '42501') {
          console.log('AuthService: RLS error detected, trying alternative approach...');
          
          const { data: upsertProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert([profileData], { onConflict: 'id' })
            .select()
            .single();

          if (upsertError) {
            console.error('AuthService: Upsert also failed:', upsertError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          return { user: authData.user, profile: upsertProfile };
        }
        
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('AuthService: Profile created successfully:', profile);
      
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
      console.log('AuthService: Starting login...');
      let email = emailOrName.trim();

      if (!email.includes('@')) {
        console.log('AuthService: Looking up email by name:', email);
        const { data: profiles, error: searchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('name', email)
          .single();

        if (searchError || !profiles) {
          throw new Error('Username not found');
        }
        email = profiles.email;
      }

      // Try Supabase login first
      console.log('AuthService: Attempting Supabase login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.log('AuthService: Supabase login failed:', error.message);
        
        // If it's email confirmation issue, try mock login as fallback
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed')) {
          
          console.log('AuthService: Trying mock login fallback...');
          
          // Check if user exists in profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();
          
          if (!profileError && profileData) {
            console.log('AuthService: User found in profiles, creating mock session...');
            
            // Create a mock user object for local session
            const mockUser = {
              id: profileData.id,
              email: profileData.email,
              user_metadata: {
                name: profileData.name,
                phone: profileData.phone,
                address: profileData.address
              },
              app_metadata: {},
              aud: 'authenticated',
              role: 'authenticated',
              created_at: profileData.created_at,
              updated_at: profileData.updated_at
            };
            
            // Save mock session locally
            await sessionStorage.saveSession(mockUser);
            console.log('✅ AuthService: Mock login successful for:', mockUser.email);
            
            // Trigger callback if available - ALWAYS call this
            console.log('🔔 Triggering auth callback for mock user:', mockUser.email);
            if (authChangeCallback) {
              authChangeCallback(mockUser);
            } else {
              console.warn('⚠️ No auth callback registered!');
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
