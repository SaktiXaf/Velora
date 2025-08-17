import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth as useAuthHook } from '@/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authData = useAuthHook();

  const contextValue: AuthContextType = {
    user: authData.user,
    isAuthenticated: authData.isAuthenticated,
    loading: authData.loading,
    initialized: authData.initialized,
    refreshAuth: authData.refreshAuth,
    signOut: authData.signOut
  };

  console.log('🏗️ AuthProvider render:', {
    isAuthenticated: contextValue.isAuthenticated,
    userEmail: contextValue.user?.email || 'none',
    initialized: contextValue.initialized,
    loading: contextValue.loading
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
