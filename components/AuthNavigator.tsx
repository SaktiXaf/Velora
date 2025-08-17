import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Theme } from '@/constants/Theme';

interface AuthNavigatorProps {
  children: React.ReactNode;
}

export default function AuthNavigator({ children }: AuthNavigatorProps) {
  const { colors } = useTheme();
  const { isAuthenticated, loading, initialized } = useGlobalAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthScreen = segments[0] === 'auth';
    const inLoginScreen = segments[0] === 'login';
    const inRegisterScreen = segments[0] === 'register';
    const inProfileTab = segments[0] === '(tabs)' && segments[1] === 'profile';

    console.log('🚀 AuthNavigator: Checking route...', {
      isAuthenticated,
      initialized,
      currentSegments: segments,
      inTabsGroup,
      inAuthScreen,
      inLoginScreen,
      inRegisterScreen,
      inProfileTab
    });

    if (isAuthenticated && !inTabsGroup) {
      // User is authenticated but not in tabs, redirect to home
      console.log('✅ User authenticated - redirecting to home tabs');
      router.replace('/(tabs)');
    } else if (!isAuthenticated && inTabsGroup && !inProfileTab) {
      // User is not authenticated but in protected tabs (except profile), redirect to auth
      console.log('❌ User not authenticated - redirecting to auth');
      router.replace('/auth');
    }
    // Allow access to login, register, auth screens, and profile tab for authentication process
  }, [isAuthenticated, initialized, loading, segments, router]);

  // Show loading screen while checking auth state
  if (!initialized || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading Velora...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            Checking your session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  loadingSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    textAlign: 'center',
  },
});
