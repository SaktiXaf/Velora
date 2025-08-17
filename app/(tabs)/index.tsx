import ActivitySummary from '@/components/ActivitySummary';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import NotificationModal from '@/components/NotificationModal';
import SearchScreen from '@/components/SearchScreen';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Activity, activityService } from '@/lib/activityService';
import { authEventEmitter } from '@/lib/authEvents';
import { ProfileService } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, user, loading, initialized } = useGlobalAuth();
  const router = useRouter();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalActivities: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const loadingRef = useRef(false);

  // Notifications hook
  const { unreadCount } = useNotifications(user?.id || '');

  const loadActivities = useCallback(async () => {
    if (loadingRef.current || !isAuthenticated || !user) {
      console.log('🚫 Skipping loadActivities:', { 
        loading: loadingRef.current, 
        isAuthenticated, 
        hasUser: !!user 
      });
      return;
    }
    
    console.log('🔍 loadActivities called with:', { 
      isAuthenticated, 
      user: user ? { id: user.id, email: user.email } : null,
      loadingRef: loadingRef.current 
    });
    
    loadingRef.current = true;
    setIsLoading(true);
    try {
      console.log(`🏠 Loading activities for user: ${user.email} (ID: ${user.id})`);
      const [recentActivities, stats, profile] = await Promise.all([
        activityService.getRecentActivities(5, user.id),
        activityService.getTotalStats(user.id),
        ProfileService.getProfile(user.id)
      ]);
      
      console.log(`📊 Loaded ${recentActivities.length} activities, stats:`, stats);
      console.log(`👤 Profile loaded:`, profile);
      setActivities(recentActivities);
      setTotalStats(stats);
      setUserName(profile?.name || user.email?.split('@')[0] || 'User');
      setUserAvatar(profile?.avatar || null);
    } catch (error) {
      console.error('❌ Error loading home data:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [isAuthenticated, user]);

  const handleFollowChange = useCallback(async () => {
    console.log('📱 Following user updated, refreshing activities...');
    await loadActivities();
  }, [loadActivities]);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Home screen focused, checking auth state:', { 
        initialized, 
        isAuthenticated, 
        user: user ? { id: user.id, email: user.email } : null 
      });
      
      if (initialized && isAuthenticated && user) {
        console.log('✅ Auth check passed, loading activities...');
        loadActivities();
      } else if (initialized) {
        console.log('❌ Auth check failed - not loading activities');
      }
    }, [initialized, isAuthenticated, user, loadActivities])
  );

      // Also reload when user changes (for account switching)
  useEffect(() => {
    console.log('👤 User state changed in index.tsx:', {
      userId: user?.id,
      email: user?.email,
      isAuthenticated,
      initialized
    });
    
    if (initialized && isAuthenticated && user) {
      console.log('🔄 User authenticated - reloading activities and profile...');
      loadActivities();
    } else if (initialized && !isAuthenticated) {
      // Clear local state when logged out
      console.log('🗑️  User not authenticated - clearing local state');
      setActivities([]);
      setUserName('');
      setUserAvatar(null);
      setTotalStats({
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalActivities: 0,
      });
    }
  }, [user?.id, user?.email, initialized, isAuthenticated, loadActivities]);

  // Listen for auth events from other components
  useEffect(() => {
    const handleAuthEvent = () => {
      console.log('📢 Auth event received in index.tsx - checking state...');
      setTimeout(() => {
        console.log('🔍 Current auth state after event:', { isAuthenticated, user: user?.email });
        if (isAuthenticated && user) {
          console.log('🔄 Auth event: Loading activities...');
          loadActivities();
        }
      }, 200);
    };

    authEventEmitter.addListener(handleAuthEvent);
    
    return () => {
      authEventEmitter.removeListener(handleAuthEvent);
    };
  }, [isAuthenticated, user, loadActivities]);

  if (!initialized || loading) {
    console.log('🔄 Showing loading state:', { initialized, loading, isAuthenticated, user: user?.email });
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="refresh" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Loading...</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            {!initialized ? 'Initializing your account...' : 'Getting your activities ready...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not authenticated, AuthNavigator should handle the redirect
  // This should not happen in normal flow, but just in case:
  if (!isAuthenticated) {
    console.log('❌ HomeScreen: User not authenticated - this should be handled by AuthNavigator');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Not Authenticated</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Redirecting to login...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ Showing authenticated home screen for user:', user?.email);

  const handleActivityPress = (activity: Activity) => {
    console.log('📱 Activity pressed:', activity.id);
    router.push('/explore'); // Navigate to explore tab for now
  };

  const handleNewActivity = () => {
    console.log('📱 Creating new activity...');
    router.push('/track');
  };

  const handleViewAllActivities = () => {
    console.log('📱 Viewing all activities...');
    router.push('/explore'); // Navigate to explore tab
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.navbar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Home</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {userName ? `Welcome back, ${userName}` : 'Your Activity Feed'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowNotificationModal(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.white }]}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadActivities}
            tintColor={colors.primary}
          />
        }
      >
        <ActivitySummary
          activities={activities}
          totalStats={totalStats}
          userName={userName}
          userAvatar={userAvatar}
          onViewAllActivities={handleViewAllActivities}
          onStartNewActivity={handleNewActivity}
        />
      </ScrollView>

      {/* Floating Action Button for Quick Activity */}
      <FloatingActionButton onPress={handleNewActivity} />

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SearchScreen
          onClose={() => setShowSearchModal(false)}
        />
      </Modal>

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        currentUserId={user?.id || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  title: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: Theme.spacing.xl,
  },
  userHeader: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Theme.spacing.md,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  profileImageText: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.white,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  userNameText: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginTop: 2,
  },
  statsContainer: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  statsTitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.sm,
    margin: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
  },
  statNumber: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
});
