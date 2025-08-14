import { clearAuthChangeCallback, setAuthChangeCallback } from '@/lib/authService';
import { ProfileService } from '@/lib/profileService';
import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Force refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      console.log('🔄 RefreshAuth called');
      setLoading(true);
      const localSession = await sessionStorage.getStoredSession();
      console.log('🔄 RefreshAuth: Local session:', localSession?.email || 'none');
      
      if (localSession) {
        const mockUser = {
          id: localSession.userId,
          email: localSession.email,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          role: 'authenticated',
          created_at: localSession.lastLogin,
          updated_at: localSession.lastLogin
        } as User;
        console.log('✅ RefreshAuth: Setting user:', mockUser.email, 'ID:', mockUser.id);
        setUser(mockUser);
        setInitialized(true);
        
        // Force sync profile and avatar from server for cross-device consistency
        console.log('📱 Force syncing profile for cross-device login...');
        await ProfileService.forceProfileSync(mockUser.id);
      } else {
        console.log('❌ RefreshAuth: No session, clearing user');
        setUser(null);
        setInitialized(true);
      }
    } catch (error) {
      console.error('❌ RefreshAuth error:', error);
      setUser(null);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize once
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        setLoading(true);
        const localSession = await sessionStorage.getStoredSession();
        console.log('📱 Local session found:', localSession?.email || 'none');
        
        if (localSession && mounted) {
          const mockUser = {
            id: localSession.userId,
            email: localSession.email,
            user_metadata: {},
            app_metadata: {},
            aud: 'authenticated',
            role: 'authenticated',
            created_at: localSession.lastLogin,
            updated_at: localSession.lastLogin
          } as User;
          console.log('✅ Setting user from local session:', mockUser.email);
          setUser(mockUser);
          
          // Force sync profile and avatar for cross-device consistency
          console.log('📱 Syncing profile on auth initialization...');
          await ProfileService.forceProfileSync(mockUser.id);
        } else if (mounted) {
          console.log('❌ No local session, clearing user');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // Auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Supabase auth event:', event, session?.user?.email || 'no user');
        if (mounted) {
          if (session?.user) {
            console.log('✅ Auth: Setting Supabase user:', session.user.email);
            setUser(session.user);
            await sessionStorage.saveSession(session.user);
            
            // Sync profile on Supabase auth change
            console.log('📱 Syncing profile on Supabase auth change...');
            await ProfileService.forceProfileSync(session.user.id);
          } else {
            console.log('❌ Auth: Clearing user');
            setUser(null);
            await sessionStorage.clearSession();
          }
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    // Mock auth callback - force state update
    const handleMockAuthChange = async (mockUser: any) => {
      console.log('🔔 Mock auth callback:', mockUser?.email || 'no user');
      if (mounted && mockUser) {
        console.log('✅ Mock: Setting user:', mockUser.email);
        setUser(mockUser);
        setLoading(false);
        setInitialized(true);
        
        // Sync profile on mock auth change
        console.log('📱 Syncing profile on mock auth change...');
        await ProfileService.forceProfileSync(mockUser.id);
        
        // Force a small delay to ensure state propagation
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    setAuthChangeCallback(handleMockAuthChange);
    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearAuthChangeCallback();
    };
  }, []); // Only run once

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user:', user?.email);
      
      // Clear all local session data
      await sessionStorage.clearSession();
      
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, [user?.email]);

  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    signOut,
    refreshAuth,
  };
}
