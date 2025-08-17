import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthLoadingScreenProps {
  children: React.ReactNode;
}

export default function AuthLoadingScreen({ children }: AuthLoadingScreenProps) {
  const { loading, isAuthenticated } = useGlobalAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Auto-navigate to home when user is authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('🚀 AuthLoadingScreen: User authenticated, navigating to home');
      router.replace('/(tabs)');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading BlueTrack...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            Checking saved session...
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
    fontFamily: Theme.typography.fontFamily.regular,
  },
});
