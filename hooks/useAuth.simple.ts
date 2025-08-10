import { clearAuthChangeCallback, setAuthChangeCallback } from '@/lib/authService';
import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Simple refresh function - no logs to prevent re-renders
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
    } catch (error) {
      setUser(null);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, []);

  // Initialize once
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const localSession = await sessionStorage.getStoredSession();
        
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
          setUser(mockUser);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    // Mock auth callback
    const handleMockAuthChange = async (mockUser: any) => {
      if (mounted && mockUser) {
        setUser(mockUser);
        setLoading(false);
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
      await sessionStorage.clearSession();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    signOut,
    refreshAuth,
  };
}
