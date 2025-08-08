import ActivityItem from '@/components/ActivityItem';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Activity, activityService } from '@/lib/activityService';
import { ProfileService } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
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
  const loadingRef = useRef(false);

  const loadActivities = useCallback(async () => {
    if (loadingRef.current) return; // Prevent multiple simultaneous loads
    
    loadingRef.current = true;
    setIsLoading(true);
    try {
      if (isAuthenticated && user) {
        console.log(`🏠 Loading activities for user: ${user.email}`);
        const [recentActivities, stats, profile] = await Promise.all([
          activityService.getRecentActivities(5, user.id), 
          activityService.getTotalStats(user.id),
          ProfileService.getProfile(user.id)
        ]);
        
        console.log(`📊 Loaded ${recentActivities.length} activities for user`);
        setActivities(recentActivities);
        setTotalStats(stats);
        setUserName(profile?.name || user.email?.split('@')[0] || 'User');
        setUserAvatar(profile?.avatar || null);
      } else {
        console.log('🔒 User not authenticated, clearing activities');
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
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      // Reset to empty state on error
      setActivities([]);
      setUserName('');
      setUserAvatar(null);
      setTotalStats({
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalActivities: 0,
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [isAuthenticated, user]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const handleActivityPress = (activity: Activity) => {
    // TODO: Navigate to activity detail
    console.log('Activity pressed:', activity);
  };

  const handleAddActivity = () => {
    if (!isAuthenticated) {
      // Redirect to profile tab for login
      router.push('/(tabs)/profile');
      return;
    }
    router.push('/(tabs)/track');
  };
  const handleSearch = () => {
    // TODO: Implement search
  };

  const handleNotification = () => {
    // TODO: Implement notifications
  };

  const renderStatsHeader = () => {
    // Only show stats if user is authenticated and has activities
    if (!isAuthenticated) {
      return null;
    }

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalStats.totalDistance.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>km total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalStats.totalActivities}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>activities</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalStats.totalCalories}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>calories</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="fitness-outline" size={64} color={colors.textSecondary} />
      {isAuthenticated ? (
        <>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Activities Yet</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Start tracking your first activity to see it here
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleAddActivity}
          >
            <Text style={[styles.startButtonText, { color: colors.background }]}>
              Start Tracking
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Required</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Please log in to track and view your activities
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleAddActivity}
          >
            <Text style={[styles.startButtonText, { color: colors.background }]}>
              Login
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderActivityItem = useCallback(({ item }: { item: Activity }) => (
    <ActivityItem
      activity={item}
      onPress={handleActivityPress}
    />
  ), []);

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isAuthenticated ? `Hi 👋 ${userName || 'User'}` : 'BlueTrack Home'}
        </Text>
        <View style={styles.navbarRight}>
          {isAuthenticated && (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')} 
              style={styles.profileImageContainer}
            >
              {userAvatar ? (
                <Image 
                  source={{ uri: userAvatar }} 
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/icon.png')}
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={16} color={colors.background} />
                </View>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNotification} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          {!isAuthenticated && (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')} 
              style={[styles.iconButton, styles.loginIconButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person-outline" size={20} color={colors.background} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={isAuthenticated ? activities : []} // Only show activities if authenticated
        keyExtractor={keyExtractor}
        renderItem={renderActivityItem}
        ListHeaderComponent={renderStatsHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        getItemLayout={(data, index) => ({
          length: 120, // Estimated item height
          offset: 120 * index,
          index,
        })}
      />

      <FloatingActionButton onPress={handleAddActivity} />
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
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: Theme.spacing.sm,
    marginLeft: Theme.spacing.sm,
  },
  loginIconButton: {
    borderRadius: Theme.borderRadius.md,
  },
  listContent: {
    paddingVertical: Theme.spacing.md,
  },
  statsContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statsTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.md,
    color: Theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    color: Theme.colors.text,
  },
  emptyDescription: {
    fontSize: Theme.typography.fontSize.md,
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  startButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  startButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  userIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  profileImageContainer: {
    marginRight: Theme.spacing.sm,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
});
