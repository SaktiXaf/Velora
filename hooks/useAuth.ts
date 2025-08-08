import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Check for existing session
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
          console.log('✅ Existing session found for user:', session.user.email);
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

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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
      setLoading(false);
    }
  };

    return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    signOut,
  };
}
