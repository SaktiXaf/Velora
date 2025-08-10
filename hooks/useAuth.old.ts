import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { setAuthChangeCallback, clearAuthChangeCallback } from '@/lib/authService';
import { User } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Stable refresh function that doesn't change on every render
  const refreshAuth = useCallback(async () => {
    try {
      const localSession = await sessionStorage.getStoredSession();
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
        setUser(mockUser);
      } else {
        setUser(null);
      }
      setInitialized(true);
      setLoading(false);
    } catch (error) {
      setUser(null);
      setInitialized(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        setLoading(true);
        
        // First check for local session (including mock sessions)
        const localSession = await sessionStorage.getStoredSession();
        console.log('🔍 Local session check result:', localSession?.email || 'No session');
        
        if (localSession && mounted) {
          console.log('📱 Local session found:', localSession.email);
          // Convert stored session to User object
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
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // Check for Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user) {
          console.log('✅ Existing Supabase session found for user:', session.user.email);
          console.log('🔄 Auto-login successful - no need to login again!');
          if (mounted) {
            setUser(session.user);
          }
        } else {
          console.log('ℹ️  No existing session found');
          console.log('🔑 User needs to login first');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user ? 'User present' : 'No user');
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await sessionStorage.saveSession(session.user);
          } else {
            setUser(null);
            await sessionStorage.clearSession();
          }
        }
      }
    );

    // Listen for mock auth changes
    const handleMockAuthChange = async (mockUser: any) => {
      console.log('🔄 Mock auth change detected:', mockUser?.email || 'No email');
      console.log('🔍 Mounted state:', mounted);
      console.log('🔍 Mock user data:', mockUser);
      if (mounted && mockUser) {
        setUser(mockUser);
        setLoading(false);
        console.log('✅ Mock user set in useAuth hook - isAuthenticated:', !!mockUser);
      }
    };

    // Set callback for auth changes
    setAuthChangeCallback(handleMockAuthChange);

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearAuthChangeCallback();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user...');
      
      // Clear local session first
      await sessionStorage.clearSession();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const refreshAuth = useCallback(async () => {
    console.log('🔄 Refreshing auth state...');
    setLoading(true);
    
    try {
      const localSession = await sessionStorage.getStoredSession();
      if (localSession) {
        console.log('📱 Found local session during refresh:', localSession.email);
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
        setUser(mockUser);
        setInitialized(true);
        console.log('✅ Auth refreshed with local session - isAuthenticated:', !!mockUser);
      } else {
        console.log('❌ No local session found during refresh');
        setUser(null);
        setInitialized(true);
      }
    } catch (error) {
      console.error('❌ Error refreshing auth:', error);
      setUser(null);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies to prevent recreation

  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    signOut,
    refreshAuth,
  };
}
