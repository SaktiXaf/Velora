import { useState, useEffect } from 'react';
import { authStateManager } from '@/lib/authStateManager';
import { User } from '@supabase/supabase-js';

export function useGlobalAuth() {
  const [authState, setAuthState] = useState(() => {
    const initial = authStateManager.getAuthState();
    console.log('🌍 useGlobalAuth: Initial state:', initial);
    return initial;
  });

  useEffect(() => {
    console.log('🌍 useGlobalAuth: Setting up listener');
    
    const handleAuthChange = (newState: any) => {
      console.log('🌍 useGlobalAuth: Received auth change:', newState);
      setAuthState(newState);
    };

    authStateManager.addListener('auth-changed', handleAuthChange);

    return () => {
      console.log('🌍 useGlobalAuth: Cleaning up listener');
      authStateManager.removeListener('auth-changed', handleAuthChange);
    };
  }, []);

  console.log('🌍 useGlobalAuth render:', {
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.user?.email || 'none',
    initialized: authState.initialized,
    loading: authState.loading
  });

  return authState;
}
