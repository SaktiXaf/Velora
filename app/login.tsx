import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { sessionStorage } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/lib/userService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', email.trim());
      console.log('🔐 Password length:', password.trim().length);
      
      // Check if user exists in our database first
      console.log('👤 Checking if user exists in database...');
      const userExistsResult = await UserService.getUserByEmail(email.trim());
      console.log('👤 User in database:', userExistsResult.success);
      
      // Test Supabase connection first
      console.log('🔍 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
      console.log('🔍 Connection test result:', { success: !testError, error: testError?.message });
      
      // Try to sign in with Supabase Auth
      console.log('🔐 Attempting Supabase Auth signIn...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('🔐 Login response:', { 
        user: data.user?.email, 
        userId: data.user?.id,
        session: !!data.session,
        sessionValid: !!data.session?.access_token,
        error: error?.message,
        errorCode: error?.name || error?.status
      });

      if (error) {
        console.error('❌ Login error details:', {
          message: error.message,
          name: error.name,
          status: error.status,
          cause: error.cause
        });
        
        // Show appropriate error message with more details
        let errorMessage = error.message;
        if (error.message === 'Invalid login credentials') {
          // Check if user exists in database to provide better guidance
          if (userExistsResult.success) {
            // User exists in database but not in auth - likely need to register auth account
            Alert.alert(
              'Authentication Issue',
              `Your account exists in our system but there's an authentication problem.\n\nEmail: ${email.trim()}\n\nThis usually means:\n1. You haven't completed registration\n2. Wrong password\n3. Need password reset\n\nWould you like to reset your password?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset Password', 
                  onPress: () => handlePasswordReset(email.trim())
                },
                { text: 'Try Again', style: 'default' }
              ]
            );
          } else {
            // User doesn't exist in database - need to register
            Alert.alert(
              'Account Not Found',
              `No account found with email: ${email.trim()}\n\nPlease register first to create your account.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Register Now', 
                  onPress: () => router.replace('/register')
                }
              ]
            );
          }
          return;
        } else if (error.message === 'Email not confirmed') {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('signup') || error.message.includes('not found')) {
          errorMessage = `No account found with email: ${email.trim()}\n\nPlease register first or check your email address.`;
        }
        
        Alert.alert('Login Failed', errorMessage);
        return;
      }

      if (data.user && data.session) {
        console.log('✅ Login successful for user:', data.user.email);
        
        // Check if user profile exists in database, create if not
        const userExists = await UserService.userProfileExists(data.user.id);
        if (!userExists) {
          console.log('👤 User profile not found, creating...');
          const createResult = await UserService.createUserProfile(
            data.user.id, 
            data.user.email || ''
          );
          
          if (!createResult.success) {
            console.warn('⚠️ Failed to create user profile:', createResult.error);
          } else {
            console.log('✅ User profile created in database');
          }
        }
        
        // Fetch complete user profile from database
        const profileResult = await UserService.getUserProfile(data.user.id);
        if (profileResult.success && profileResult.user) {
          console.log('✅ User profile loaded:', profileResult.user);
        }
        
        // Store session locally
        await sessionStorage.saveSession({
          id: data.user.id,
          email: data.user.email || '',
        });

        console.log('📱 Session stored, navigating to home...');
        // Navigate to home
        router.replace('/(tabs)');
      } else {
        console.log('❌ Login succeeded but no user/session data received');
        Alert.alert('Login Failed', 'Authentication succeeded but no session was created');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      console.log('🔄 Requesting password reset for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('❌ Password reset error:', error);
        Alert.alert('Reset Failed', error.message);
      } else {
        console.log('✅ Password reset email sent');
        Alert.alert(
          'Reset Email Sent',
          `Password reset instructions have been sent to ${email}.\n\nPlease check your email and follow the instructions to reset your password.`
        );
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      Alert.alert('Reset Failed', 'An unexpected error occurred while requesting password reset.');
    }
  };

  const handleBackToAuth = () => {
    router.back();
  };

  const handleGoToRegister = () => {
    router.replace('/register');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackToAuth} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              Sign In
            </Text>
          </View>

          {/* Logo */}
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="fitness" size={48} color={colors.white} />
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Welcome back! Please sign in to your account.
          </Text>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.white }]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleGoToRegister}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  passwordToggle: {
    padding: 4,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
