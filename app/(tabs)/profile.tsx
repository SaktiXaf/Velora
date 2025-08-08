import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import LoginScreen from '@/components/LoginScreen';
import { ProfileImagePicker } from '@/components/ProfileImagePicker';
import RegisterScreen from '@/components/RegisterScreen';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
  name: string;
  bio: string;
  avatar: string | null;
  age: number | null;
  stats: {
    totalDistance: number;
    totalTime: number;
    totalActivities: number;
    followers: number;
    following: number;
  };
}

const initialUser: UserData = {
  name: 'Sakti Selginov',
  bio: 'Lari doang, Muncak kadang"',
  avatar: null,
  age: null,
  stats: {
  totalDistance: 1250.5,
  totalTime: 98400, 
  totalActivities: 85,
  followers: 245,
  following: 173,
  },
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function ProfileScreen() {
  const { mode, toggleTheme, colors } = useTheme();
  const { isAuthenticated, user, signOut } = useAuth();
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showRegisterScreen, setShowRegisterScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(initialUser);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatar, setEditedAvatar] = useState<string | null>(null);
  const [editedAge, setEditedAge] = useState('');
  const [loading, setLoading] = useState(false);

  // Check authentication status when this tab is focused (but don't auto-show login)
  useFocusEffect(
    useCallback(() => {
      // Just check status, don't auto-show login screen
      console.log('Profile tab focused, authenticated:', isAuthenticated);
    }, [isAuthenticated])
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile(user.id);
    }
  }, [isAuthenticated, user]);

  const loadUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      const profile = await ProfileService.getProfile(userId);
      if (profile) {
        setUserData({
          name: profile.name,
          bio: profile.bio || '',
          avatar: profile.avatar || null,
          age: profile.age || null,
          stats: {
            totalDistance: 1250.5, 
            totalTime: 98400,
            totalActivities: 85,
            followers: 245,
            following: 173,
          },
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isEditing) {
      setEditedName(userData.name);
      setEditedBio(userData.bio);
      setEditedAvatar(userData.avatar);
      setEditedAge(userData.age ? userData.age.toString() : '');
    }
  }, [isEditing]);

  const handleLoginSuccess = async (userData: any) => {
    console.log('✅ Login successful in profile screen:', userData);
    setShowLoginScreen(false);
    // Force a small delay to ensure auth state updates
    setTimeout(() => {
      console.log('🔄 Login screen closed, auth should be updated');
    }, 100);
  };

  const handleRegisterSuccess = () => {
    console.log('Registration successful');
    setShowRegisterScreen(false);
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setLoading(true);
    try {
      const ageNumber = editedAge.trim() ? parseInt(editedAge.trim()) : undefined;
      
      if (editedAge.trim() && (isNaN(ageNumber!) || ageNumber! < 1 || ageNumber! > 120)) {
        Alert.alert('Error', 'Please enter a valid age (1-120)');
        setLoading(false);
        return;
      }

      const updates = {
        name: editedName.trim(),
        bio: editedBio.trim(),
        age: ageNumber,
        avatar: editedAvatar || undefined,
      };

      const success = await ProfileService.updateProfile(user.id, updates);
      
      if (success) {
        setUserData(prev => ({
          ...prev,
          name: editedName.trim(),
          bio: editedBio.trim(),
          age: ageNumber || null,
          avatar: editedAvatar,
        }));
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (showRegisterScreen) {
    return (
      <RegisterScreen
        onBack={() => setShowRegisterScreen(false)}
        onSuccess={handleRegisterSuccess}
      />
    );
  }

  if (showLoginScreen) {
    return (
      <LoginScreen
        onBack={() => setShowLoginScreen(false)}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.editHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.background }]}
            onPress={() => setIsEditing(false)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.editTitle, { color: colors.text }]}>Edit Profile</Text>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.saveButtonText, { color: colors.white }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.editScrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.editContent}>
          <View style={styles.editAvatarContainer}>
            <ProfileImagePicker
              value={editedAvatar}
              onChange={setEditedAvatar}
              size={120}
            />
            <Text style={[styles.editAvatarText, { color: colors.textSecondary }]}>Tap to change photo</Text>
          </View>

          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editedAge}
                onChangeText={setEditedAge}
                placeholder="Enter your age"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editedBio}
                onChangeText={setEditedBio}
                placeholder="Write something about yourself..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      setIsEditing(false);
      setUserData(initialUser);
      setShowLoginScreen(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleAvatarSave = async (newAvatar: string | null) => {
    if (!user) return;
    
    try {
      let avatarUrl = newAvatar;
      
      // If newAvatar is a local URI, upload it to Supabase storage first
      if (newAvatar && newAvatar.startsWith('file://')) {
        try {
          // Create FormData for the file upload
          const response = await fetch(newAvatar);
          const blob = await response.blob();
          
          avatarUrl = await ProfileService.uploadAvatar(user.id, blob);
          
          // If storage upload fails, fall back to base64 encoding
          if (!avatarUrl) {
            console.log('Storage upload failed, using base64 fallback');
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
            });
            reader.readAsDataURL(blob);
            avatarUrl = await base64Promise;
          }
        } catch (uploadError) {
          console.error('Error processing image:', uploadError);
          Alert.alert('Error', 'Failed to process profile picture');
          return;
        }
      }
      
      const success = await ProfileService.updateProfile(user.id, {
        avatar: avatarUrl || undefined,
      });
      
      if (!success) {
        setUserData(prev => ({
          ...prev,
          avatar: userData.avatar
        }));
        Alert.alert('Error', 'Failed to update profile picture');
      } else {
        setUserData(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      setUserData(prev => ({
        ...prev,
        avatar: userData.avatar
      }));
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loginContainer}>
          <Ionicons name="refresh-outline" size={60} color={colors.primary} />
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loginContainer}>
          <Ionicons name="person-circle-outline" size={120} color={colors.textSecondary} />
          <Text style={[styles.loginTitle, { color: colors.text }]}>Welcome to Strava</Text>
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>Please login to view your profile</Text>
          
          <View style={styles.loginButtonContainer}>
            <Button
              title="Login"
              onPress={() => setShowLoginScreen(true)}
              variant="primary"
              size="large"
            />
            <Button
              title="Register"
              onPress={() => setShowRegisterScreen(true)}
              variant="outline"
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: colors.surface }]}
          onPress={toggleTheme}
        >
          <Ionicons 
            name={mode === 'dark' ? "sunny" : "moon"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.surface }]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "close" : "settings"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Ionicons 
            name="log-out-outline" 
            size={24} 
            color={colors.error} 
          />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <ProfileImagePicker
            value={isEditing ? editedAvatar : userData.avatar}
            onChange={(newAvatar) => {
              if (isEditing) {
                setEditedAvatar(newAvatar);
              } else {
                setUserData(prev => ({
                  ...prev,
                  avatar: newAvatar
                }));
                if (user && newAvatar !== userData.avatar) {
                  handleAvatarSave(newAvatar);
                }
              }
            }}
            size={100}
          />
        </View>

        {!isEditing && (
          <>
            <Text style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
            {userData.age && (
              <Text style={[styles.age, { color: colors.textSecondary }]}>{userData.age} years old</Text>
            )}
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{userData.bio || 'No bio yet'}</Text>
          </>
        )}
        
        <View style={styles.followContainer}>
          <View style={styles.followItem}>
            <Text style={[styles.followCount, { color: colors.text }]}>{userData.stats.followers}</Text>
            <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Followers</Text>
          </View>
          <View style={[styles.followDivider, { backgroundColor: colors.border }]} />
          <View style={styles.followItem}>
            <Text style={[styles.followCount, { color: colors.text }]}>{userData.stats.following}</Text>
            <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{userData.stats.totalDistance.toFixed(1)}</Text>
            <Text style={[styles.statUnit, { color: colors.textSecondary }]}>km</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Distance</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(userData.stats.totalTime)}</Text>
            <Text style={[styles.statUnit, { color: colors.textSecondary }]}></Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Time</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="fitness-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{userData.stats.totalActivities}</Text>
            <Text style={[styles.statUnit, { color: colors.textSecondary }]}>activities</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activities</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="speedometer-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{(userData.stats.totalDistance / (userData.stats.totalTime / 3600)).toFixed(1)}</Text>
            <Text style={[styles.statUnit, { color: colors.textSecondary }]}>km/h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Speed</Text>
          </View>
        </View>
      </View>

      <Card title="Achievements" style={styles.achievementsCard}>
        <Text style={styles.comingSoon}>Coming soon...</Text>
      </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  editButton: {
    position: 'absolute',
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.full,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  themeButton: {
    position: 'absolute',
    top: Theme.spacing.md,
    right: Theme.spacing.md + 60, // Position to the left of edit button
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.full,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: Theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.white,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  input: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.text,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Theme.spacing.md,
  },
  name: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  age: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  bio: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  followContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followItem: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  followCount: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  followLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
  },
  followDivider: {
    width: 1,
    height: 24,
    backgroundColor: Theme.colors.border,
  },
  statsContainer: {
    padding: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  statUnit: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  achievementsCard: {
    margin: Theme.spacing.md,
  },
  comingSoon: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    padding: Theme.spacing.lg,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loginTitle: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  loginButtonContainer: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  logoutButton: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: Theme.spacing.md,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.full,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Edit Profile Styles
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
  },
  editTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  saveButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  saveButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.white,
  },
  editScrollView: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  editContent: {
    padding: Theme.spacing.lg,
  },
  editAvatarContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  editAvatarText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  inputLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
});
