import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { sessionStorage } from '@/lib/sessionStorage';
import { ProfileService } from '@/lib/profileService';
import { authStateManager } from '@/lib/authStateManager';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function DebugAuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all stored sessions, profile cache, and force logout. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Clearing all authentication data...');
              
              // 1. Clear local session storage
              await sessionStorage.clearSession();
              console.log('✅ Session storage cleared');
              
              // 2. Clear profile cache
              await ProfileService.clearAllProfileCache();
              console.log('✅ Profile cache cleared');
              
              // 3. Sign out from Supabase
              await supabase.auth.signOut();
              console.log('✅ Supabase sign out');
              
              // 4. Reset auth state manager
              authStateManager.setAuthState(null, false, true, false);
              console.log('✅ Auth state reset');
              
              Alert.alert('Success', 'All data cleared. App will restart.', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Force navigation to auth screen
                    router.replace('/auth');
                  }
                }
              ]);
            } catch (error) {
              console.error('❌ Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear all data');
            }
          }
        }
      ]
    );
  };

  const handleCheckStoredSession = async () => {
    try {
      const session = await sessionStorage.getStoredSession();
      console.log('📱 Stored session:', session);
      
      Alert.alert(
        'Stored Session',
        session
          ? `Email: ${session.email}\nUser ID: ${session.userId}\nLast Login: ${session.lastLogin}`
          : 'No stored session found'
      );
    } catch (error) {
      console.error('❌ Error checking session:', error);
      Alert.alert('Error', 'Failed to check stored session');
    }
  };

  const handleGoToAuth = () => {
    router.replace('/auth');
  };

  const handleGoToRegister = () => {
    router.replace('/register');
  };

  const handleGoToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="bug" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Debug Auth</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Debug authentication and clear stored data
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.error }]}
            onPress={handleClearAllData}
          >
            <Ionicons name="trash" size={20} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleCheckStoredSession}
          >
            <Ionicons name="information-circle" size={20} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>
              Check Stored Session
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={handleGoToAuth}
          >
            <Ionicons name="home" size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Go to Auth Screen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={handleGoToRegister}
          >
            <Ionicons name="person-add" size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Go to Register
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={handleGoToLogin}
          >
            <Ionicons name="log-in" size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
});
