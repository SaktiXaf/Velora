import { Button } from '@/components/Button';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/lib/authService';
import { sessionStorage } from '@/lib/sessionStorage';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TestLoginScreenProps {
  onBack?: () => void;
}

export default function TestLoginScreen({ onBack }: TestLoginScreenProps) {
  const { colors } = useTheme();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick test accounts
  const testAccounts = [
    { name: 'Sakti', email: 'sakti@test.com', password: 'password123' },
    { name: 'John', email: 'john@test.com', password: 'password123' },
    { name: 'Jane', email: 'jane@test.com', password: 'password123' },
  ];

  const handleLogin = async (testEmail?: string, testPassword?: string) => {
    const loginEmail = testEmail || email;
    const loginPassword = testPassword || password;

    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🔑 Attempting login with:', loginEmail);
      
      // Force clear any existing session first
      await sessionStorage.clearAllUserData();
      
      const result = await AuthService.loginUser(loginEmail, loginPassword);
      console.log('✅ Login result:', result);

      if (result.user) {
        console.log('✅ Login successful, forcing auth refresh...');
        
        // Force multiple refreshes to ensure state updates
        setTimeout(async () => {
          await refreshAuth?.();
          setTimeout(async () => {
            await refreshAuth?.();
            console.log('🔄 Final auth refresh completed');
          }, 500);
        }, 200);

        Alert.alert('Success', `Logged in as ${result.user.email}`);
      } else {
        throw new Error('Login failed - no user returned');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account: typeof testAccounts[0]) => {
    console.log('🚀 Quick login for:', account.name);
    handleLogin(account.email, account.password);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {onBack && (
          <Button
            title="← Back"
            onPress={onBack}
          />
        )}
        
        <Text style={[styles.title, { color: colors.text }]}>Test Login</Text>
        
        {/* Quick Login Buttons */}
        <View style={styles.quickLoginContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Login:</Text>
          {testAccounts.map((account, index) => (
            <Button
              key={index}
              title={`Login as ${account.name} (${account.email})`}
              onPress={() => handleQuickLogin(account)}
              disabled={loading}
            />
          ))}
        </View>

        {/* Manual Login */}
        <View style={styles.manualLoginContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual Login:</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Email or Username"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Login"
            onPress={() => handleLogin()}
            disabled={loading}
          />
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
    padding: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  quickLoginContainer: {
    marginBottom: Theme.spacing.xl,
  },
  quickButton: {
    marginBottom: Theme.spacing.sm,
  },
  manualLoginContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
  },
  loginButton: {
    marginTop: Theme.spacing.md,
  },
});
