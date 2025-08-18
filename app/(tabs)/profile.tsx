import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import EditProfileModal, { ProfileUpdateData } from '@/components/EditProfileModal';
import FollowListModal from '@/components/FollowListModal';
import LoginScreen from '@/components/LoginScreen';
import { ProfileImagePicker } from '@/components/ProfileImagePicker';
import RegisterScreen from '@/components/RegisterScreen';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useFollowStats } from '@/hooks/useFollowStats';
import { activityService } from '@/lib/activityService';
import { authEventEmitter } from '@/lib/authEvents';
import { ProfileService } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  name: 'User',
  bio: '',
  avatar: null,
  age: null,
  stats: {
    totalDistance: 0,
    totalTime: 0,
    totalActivities: 0,
    followers: 0,
    following: 0,
  },
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function ProfileScreen() {
  const { mode, toggleTheme, colors } = useTheme();
  const { isAuthenticated, user, signOut, refreshAuth } = useAuth();
  const { stats: followStats, isLoading: followStatsLoading, refreshStats } = useFollowStats(user?.id || null);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showRegisterScreen, setShowRegisterScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [followModalTitle, setFollowModalTitle] = useState('');

  // Single focus effect to handle all loading
  useFocusEffect(
    useCallback(() => {
      console.log('Profile tab focused, authenticated:', isAuthenticated);
      if (isAuthenticated && user) {
        console.log('📊 Profile focused, loading data for:', user.id);
        loadUserProfile(user.id);
      }
    }, [isAuthenticated, user?.id])
  );

  // Update userData when followStats change (real-time updates)
  useEffect(() => {
    if (followStats && !followStatsLoading) {
      console.log('🔔 Updating follow stats:', followStats);
      setUserData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: followStats.followers,
          following: followStats.following,
        }
      }));
    }
  }, [followStats, followStatsLoading]);

  const loadUserProfile = async (userId: string) => {
    if (loading) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }
    
    setLoading(true);
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Loading timeout reached, setting default profile');
      setUserData(prev => ({
        name: user?.email?.split('@')[0] || 'User',
        bio: '',
        avatar: null,
        age: null,
        stats: {
          totalDistance: 0,
          totalTime: 0,
          totalActivities: 0,
          followers: prev.stats.followers,
          following: prev.stats.following,
        },
      }));
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      console.log('🔄 Loading user profile for userId:', userId);
      
      // Simple profile load - avoid complex parallel calls
      let profile = await ProfileService.getProfile(userId);
      
      if (!profile && user?.email) {
        console.log('🔍 No profile found, creating basic profile...');
        await ProfileService.ensureProfileExists(userId, user.email, undefined);
        profile = await ProfileService.getProfile(userId);
      }
      
      // Load activity stats separately and simply
      let activityStats = { totalDistance: 0, totalDuration: 0, totalActivities: 0 };
      try {
        activityStats = await activityService.getTotalStats(userId);
      } catch (statsError) {
        console.log('⚠️ Could not load activity stats:', statsError);
      }
      
      if (profile) {
        console.log('✅ Profile loaded:', profile.name);
        setUserData(prev => ({
          name: profile.name,
          bio: profile.bio || '',
          avatar: profile.avatar || null,
          age: profile.age || null,
          stats: {
            totalDistance: activityStats.totalDistance,
            totalTime: activityStats.totalDuration,
            totalActivities: activityStats.totalActivities,
            // Keep existing follow stats
            followers: prev.stats.followers,
            following: prev.stats.following,
          },
        }));
      } else {
        console.log('⚠️ Using default profile data');
        setUserData(prev => ({
          name: user?.email?.split('@')[0] || 'User',
          bio: '',
          avatar: null,
          age: null,
          stats: {
            totalDistance: activityStats.totalDistance,
            totalTime: activityStats.totalDuration,
            totalActivities: activityStats.totalActivities,
            followers: prev.stats.followers,
            following: prev.stats.following,
          },
        }));
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      // Set safe defaults
      setUserData(prev => ({
        name: 'User',
        bio: '',
        avatar: null,
        age: null,
        stats: {
          totalDistance: 0,
          totalTime: 0,
          totalActivities: 0,
          followers: prev.stats.followers,
          following: prev.stats.following,
        },
      }));
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (userData: any) => {
    console.log('✅ Login successful in profile screen:', userData);
    console.log('🔧 Current auth state before refresh:', { isAuthenticated, user: user?.email });
    
    setShowLoginScreen(false);
    
    // Ensure profile exists in database and cache
    if (userData.id && userData.email) {
      console.log('🔍 Ensuring profile exists for user:', userData.id);
      await ProfileService.ensureProfileExists(userData.id, userData.email, userData.name);
      
      // Load profile with persistence priority
      console.log('📱 Loading profile with persistence for logged in user...');
      const savedProfile = await ProfileService.loadProfileWithPersistence(userData.id);
      if (savedProfile) {
        console.log('✅ Restored profile data after login:', {
          name: savedProfile.name,
          bio: savedProfile.bio || 'No bio',
          age: savedProfile.age || 'No age',
          hasAvatar: !!savedProfile.avatar
        });
      }
    }
    
    // Force refresh auth state to recognize mock session
    console.log('🔄 Calling refreshAuth to update authentication state...');
    try {
      await refreshAuth?.();
      console.log('✅ First refreshAuth completed');
    } catch (error) {
      console.error('❌ RefreshAuth error:', error);
    }
    
    // Emit auth event to trigger updates in all components
    setTimeout(() => {
      console.log('📢 Emitting auth event after login...');
      authEventEmitter.emit();
    }, 300);
    
    // Force a small delay to ensure auth state updates
    setTimeout(async () => {
      console.log('🔄 Second refresh after delay...');
      try {
        await refreshAuth?.();
        console.log('✅ Second refreshAuth completed');
        
        // Another event emission to ensure all components are updated
        authEventEmitter.emit();
      } catch (error) {
        console.error('❌ Second refreshAuth error:', error);
      }
      
      // Check final auth state
      setTimeout(() => {
        console.log('🔍 Final auth state check in profile:', { isAuthenticated, user: user?.email });
      }, 200);
    }, 700);
  };

  const handleRegisterSuccess = () => {
    console.log('✅ Registration successful');
    setShowRegisterScreen(false);
    
    // Profile will be created when auth state changes and loadUserProfile is called
  };

  // Handle follow list modal
  const handleShowFollowers = () => {
    console.log('🔍 Show followers clicked for user:', user?.id);
    console.log('📊 Current followers count:', userData.stats.followers);
    setFollowModalType('followers');
    setFollowModalTitle(`${userData.stats.followers} Followers`);
    setShowFollowModal(true);
    console.log('✅ Follow modal state set to show followers');
  };

  const handleShowFollowing = () => {
    setFollowModalType('following');
    setFollowModalTitle(`${userData.stats.following} Following`);
    setShowFollowModal(true);
  };

  const handleSave = async (data: ProfileUpdateData): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return false;
    }

    try {
      console.log('💾 Saving profile data:', data);
      console.log('👤 User info:', { id: user.id, email: user.email });
      
      // Convert ProfileUpdateData to the expected format
      const updates = {
        name: data.name,
        bio: data.bio,
        age: data.age,
        avatar: data.avatar === null ? undefined : data.avatar,
      };

      console.log('📝 Sending updates to ProfileService:', updates);

      // Always save - ProfileService will handle database vs cache logic
      const success = await ProfileService.updateProfile(user.id, updates);
      
      if (success) {
        // Update local state immediately
        setUserData(prev => ({
          ...prev,
          name: data.name,
          bio: data.bio,
          age: data.age || null,
          avatar: data.avatar !== undefined ? data.avatar : prev.avatar,
        }));
        
        console.log('✅ Profile updated successfully - data is now persistent');
        
        // Show success message
        Alert.alert(
          'Profil Tersimpan!',
          'Profil Anda telah disimpan dan akan tetap ada saat login kembali.',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        Alert.alert('Error', 'Gagal menyimpan profil. Silakan coba lagi.');
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan profil.');
      return false;
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

  const handleLogout = async () => {
    try {
      console.log('🔐 Starting logout process...');
      
      // Clear profile cache first to ensure clean logout
      await ProfileService.clearAllProfileCacheEnhanced();
      
      // Then sign out
      await signOut();
      setIsEditing(false);
      setUserData(initialUser);
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      Alert.alert('Error', 'Failed to logout completely, but you have been signed out.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loginContainer}>
          <Ionicons name="refresh-outline" size={60} color={colors.primary} />
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>Loading Profile...</Text>
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>This should only take a moment</Text>
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
          onPress={() => setIsEditing(true)}
        >
          <Ionicons 
            name="settings" 
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
            value={userData.avatar}
            onChange={(newAvatar) => {
              setUserData(prev => ({
                ...prev,
                avatar: newAvatar
              }));
            }}
            size={100}
          />
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
        {userData.age && (
          <Text style={[styles.age, { color: colors.textSecondary }]}>{userData.age} years old</Text>
        )}
        <Text style={[styles.bio, { color: colors.textSecondary }]}>{userData.bio || 'No bio yet'}</Text>
        
        <View style={styles.followContainer}>
          <TouchableOpacity style={styles.followItem} onPress={handleShowFollowers}>
            <Text style={[styles.followCount, { color: colors.text }]}>{userData.stats.followers}</Text>
            <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.followDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.followItem} onPress={handleShowFollowing}>
            <Text style={[styles.followCount, { color: colors.text }]}>{userData.stats.following}</Text>
            <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Following</Text>
          </TouchableOpacity>
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

      {/* Follow List Modal */}
      <FollowListModal
        visible={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        userId={user?.id || ''}
        type={followModalType}
        title={followModalTitle}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        currentData={{
          name: userData.name,
          bio: userData.bio,
          age: userData.age,
          avatar: userData.avatar,
        }}
      />
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
