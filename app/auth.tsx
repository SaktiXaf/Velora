import WelcomeScreen from '@/components/WelcomeScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, initialized } = useGlobalAuth();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated) {
      console.log('🚀 AuthScreen: User already authenticated, navigating to home');
      router.replace('/(tabs)');
    }
  }, [initialized, isAuthenticated, router]);

  // Don't render welcome screen if user is authenticated
  if (initialized && isAuthenticated) {
    return null;
  }

  const handleSignIn = () => {
    console.log('📱 AuthScreen: Navigating to login screen');
    router.push('/login');
  };

  const handleSignUp = () => {
    console.log('📱 AuthScreen: Navigating to register screen');
    router.push('/register');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <WelcomeScreen 
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
