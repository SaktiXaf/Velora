import { authEventEmitter } from '@/lib/authEvents';
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

  console.log('🔧 useAuth hook render - Current state:', {
    hasUser: !!user,
    userEmail: user?.email || 'none',
    loading,
    initialized,
    isAuthenticated: !!user
  });

  // Force refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      console.log('🔄 RefreshAuth called - START');
      setLoading(true);
      
      const localSession = await sessionStorage.getStoredSession();
      console.log('🔄 RefreshAuth: Local session check result:', {
        found: !!localSession,
        email: localSession?.email || 'none',
        userId: localSession?.userId || 'none'
      });
      
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
        console.log('✅ RefreshAuth: User state updated');
        
        setInitialized(true);
        console.log('✅ RefreshAuth: Initialized set to true');
        
        // Force sync profile and avatar from server for cross-device consistency
        console.log('📱 Force syncing profile for cross-device login...');
        await ProfileService.forceProfileSync(mockUser.id);
        console.log('✅ RefreshAuth: Profile sync completed');
      } else {
        console.log('❌ RefreshAuth: No session found, clearing user');
        setUser(null);
        setInitialized(true);
      }
      
      console.log('🔄 RefreshAuth - COMPLETE');
    } catch (error) {
      console.error('❌ RefreshAuth error:', error);
      setUser(null);
      setInitialized(true);
    } finally {
      setLoading(false);
      console.log('🔄 RefreshAuth: Loading set to false');
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
        console.log('📱 Local session check result:', {
          found: !!localSession,
          email: localSession?.email || 'none',
          userId: localSession?.userId || 'none',
          lastLogin: localSession?.lastLogin || 'none'
        });
        
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
      console.log('🔔 Mock auth callback triggered:', mockUser?.email || 'no user');
      if (mounted && mockUser) {
        console.log('✅ Mock: Setting user state:', mockUser.email, 'ID:', mockUser.id);
        setUser(mockUser);
        setLoading(false);
        setInitialized(true);
        
        // Sync profile on mock auth change
        console.log('📱 Syncing profile on mock auth change...');
        try {
          await ProfileService.forceProfileSync(mockUser.id);
        } catch (error) {
          console.error('Profile sync error:', error);
        }
        
        // Force a small delay to ensure state propagation
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Mock auth state updated successfully');
        
        // Emit auth change event to all listeners
        authEventEmitter.emit();
      } else {
        console.log('❌ Mock auth callback: mounted =', mounted, 'user =', !!mockUser);
      }
    };

    console.log('🔧 Setting up auth change callback...');
    setAuthChangeCallback(handleMockAuthChange);
    console.log('✅ Auth callback registered successfully');
    
    console.log('🔧 Starting auth initialization...');
    initializeAuth();

    return () => {
      console.log('🧹 useAuth cleanup - unmounting');
      mounted = false;
      subscription?.unsubscribe();
      clearAuthChangeCallback();
      console.log('✅ Auth callback cleared on cleanup');
    };
  }, []); // Only run once

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user:', user?.email);
      
      // Only clear session data, preserve profile data for next login
      await sessionStorage.clearSession();
      
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force clear user state but keep profile data cached
      setUser(null);
      setInitialized(true);
      
      console.log('✅ Sign out successful - session cleared, profile data preserved');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force clear even if there's an error
      setUser(null);
      setInitialized(true);
      throw error;
    } finally {
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
