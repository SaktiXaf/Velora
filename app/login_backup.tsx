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
      
      // First check if user exists in our database
      const userExistsResult = await UserService.getUserByEmail(email.trim());
      console.log('👤 User exists in database:', userExistsResult.success);
      
      // Try to sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('🔐 Login response:', { 
        user: data.user?.email, 
        session: !!data.session,
        error: error?.message 
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        
        // Show appropriate error message
        let errorMessage = error.message;
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'The email or password you entered is incorrect. Please check and try again.';
        } else if (error.message === 'Email not confirmed') {
          errorMessage = 'Please check your email and confirm your account before signing in.';
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

  const handleLoginExistingAccount = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    Alert.alert(
      'Login with Existing Account',
      `We'll create authentication for ${email.trim()} and set a new password. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => createAuthForExistingUser(email.trim()) }
      ]
    );
  };

  const createAuthForExistingUser = async (email: string) => {
    setLoading(true);
    try {
      console.log('� Creating auth for existing user:', email);
      
      // Check if user exists in database first
      const userExistsResult = await UserService.getUserByEmail(email);
      if (!userExistsResult.success) {
        Alert.alert('User Not Found', 'No account found with this email. Please register first.');
        return;
      }

      const newPassword = 'Velora123!'; // Default password they can change later
      
      // Create Supabase Auth account
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: newPassword,
      });

      if (error) {
        console.error('❌ Auth creation failed:', error);
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          console.log('🔄 User already has auth account, attempting to sign in...');
          // If auth account already exists, try to sign in with different possible passwords
          const possiblePasswords = ['Velora123!', 'password123', 'velora123'];
          
          for (const tryPassword of possiblePasswords) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email,
              password: tryPassword,
            });
            
            if (!signInError && signInData.user) {
              console.log(`✅ Successfully signed in with password: ${tryPassword}`);
              await completeLogin(signInData.user);
              Alert.alert('Welcome Back!', `Successfully logged in with existing authentication.`);
              return;
            }
          }
          
          // If none of the passwords work, show reset option
          Alert.alert(
            'Account Exists', 
            'Your authentication account already exists but we cannot access it with the default passwords. Please reset your password or contact support.',
            [
              { text: 'OK', style: 'cancel' },
              { 
                text: 'Reset Password', 
                onPress: () => {
                  supabase.auth.resetPasswordForEmail(email);
                  Alert.alert('Reset Sent', 'Password reset email has been sent to your email address.');
                }
              }
            ]
          );
          return;
        }
        Alert.alert('Authentication Failed', error.message);
        return;
      }

      if (data.user) {
        console.log('✅ Auth created for existing user');
        
        // Update the existing user profile with the new auth ID
        const updateResult = await UserService.updateUserProfile(userExistsResult.user!.id, {
          id: data.user.id // Link the database profile to new auth
        });

        if (updateResult.success) {
          console.log('✅ Linked auth to existing profile');
        }

        // Since the user is already authenticated after signup, redirect directly
        console.log('📱 Authentication created, user is already signed in');
        await completeLogin(data.user);
        
        Alert.alert(
          'Welcome Back!',
          `Authentication has been created for ${email}. Your default password is: Velora123!\n\nYou can change this password later in settings.`
        );
      }
    } catch (error) {
      console.error('❌ Create auth error:', error);
      Alert.alert('Failed', 'Could not create authentication');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (user: any) => {
    try {
      console.log('🔐 Completing login for user:', user.email);
      
      // Check if user profile exists in database, create if not
      const userExists = await UserService.userProfileExists(user.id);
      if (!userExists) {
        console.log('👤 User profile not found, creating...');
        const createResult = await UserService.createUserProfile(
          user.id, 
          user.email || ''
        );
        
        if (!createResult.success) {
          console.warn('⚠️ Failed to create user profile:', createResult.error);
        } else {
          console.log('✅ User profile created in database');
        }
      }
      
      // Fetch complete user profile from database
      const profileResult = await UserService.getUserProfile(user.id);
      if (profileResult.success && profileResult.user) {
        console.log('✅ User profile loaded:', profileResult.user);
      }
      
      // Store session locally
      await sessionStorage.saveSession({
        id: user.id,
        email: user.email || '',
      });

      console.log('📱 Session stored, navigating to home...');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ Complete login error:', error);
      Alert.alert('Login Error', 'Authentication succeeded but failed to complete login process');
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

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
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
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
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

            {/* Login with Existing Account Button */}
            <TouchableOpacity 
              style={[styles.existingAccountButton, { borderColor: colors.primary }]}
              onPress={handleLoginExistingAccount}
              disabled={loading}
            >
              <Text style={[styles.existingAccountButtonText, { color: colors.primary }]}>
                Login with Existing Account
              </Text>
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
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
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
    lineHeight: 22,
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
  existingAccountButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  existingAccountButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
