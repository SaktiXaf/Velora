import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UserGreeting from './UserGreeting';

interface Activity {
  id: string;
  type: string;
  duration: number;
  distance: number;
  calories: number;
  date: string;
  pace?: number; // Changed from string to number to match activityService
  title?: string;
}

interface ActivitySummaryProps {
  activities: Activity[];
  totalStats: {
    totalDistance: number;
    totalDuration: number;
    totalCalories: number;
    totalActivities: number;
  };
  userName: string;
  userAvatar?: string | null;
  onViewAllActivities: () => void;
  onStartNewActivity: () => void;
}

export default function ActivitySummary({ 
  activities, 
  totalStats, 
  userName,
  userAvatar,
  onViewAllActivities,
  onStartNewActivity 
}: ActivitySummaryProps) {
  const { colors } = useTheme();

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'running':
      case 'run':
        return 'footsteps-outline';
      case 'cycling':
      case 'bike':
        return 'bicycle-outline';
      case 'walking':
      case 'walk':
        return 'walk-outline';
      case 'swimming':
      case 'swim':
        return 'water-outline';
      default:
        return 'fitness-outline';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      {/* User Greeting */}
      <UserGreeting userName={userName} userAvatar={userAvatar} />
      
      {/* Weekly Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.white }]}>
            This Week's Progress
          </Text>
          <Ionicons name="trending-up" size={24} color={colors.white} />
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatNumber, { color: colors.white }]}>
              {totalStats.totalDistance.toFixed(1)}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.white, opacity: 0.8 }]}>
              km
            </Text>
          </View>
          
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatNumber, { color: colors.white }]}>
              {Math.floor(totalStats.totalDuration / 60)}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.white, opacity: 0.8 }]}>
              hours
            </Text>
          </View>
          
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatNumber, { color: colors.white }]}>
              {totalStats.totalActivities}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.white, opacity: 0.8 }]}>
              workouts
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={onStartNewActivity}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>
            Start Workout
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={onViewAllActivities}
        >
          <Ionicons name="list-outline" size={24} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activities */}
      <View style={[styles.recentSection, { backgroundColor: colors.surface }]}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>
            Recent Activities
          </Text>
          {activities.length > 3 && (
            <TouchableOpacity onPress={onViewAllActivities}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Welcome to Your Fitness Journey!
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Ready to start tracking your activities? Tap below to record your first workout and see your progress here.
            </Text>
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              onPress={onStartNewActivity}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={[styles.startButtonText, { color: colors.white }]}>
                Start Your First Workout
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recentList}>
            {activities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons 
                    name={getActivityIcon(activity.type)} 
                    size={20} 
                    color={colors.primary} 
                  />
                </View>
                
                <View style={styles.activityDetails}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title || activity.type}
                  </Text>
                  <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
                    {formatDate(activity.date)} • {formatDuration(activity.duration)}
                  </Text>
                </View>
                
                <View style={styles.activityStats}>
                  <Text style={[styles.activityDistance, { color: colors.text }]}>
                    {activity.distance.toFixed(1)} km
                  </Text>
                  <Text style={[styles.activityCalories, { color: colors.textSecondary }]}>
                    {activity.calories} cal
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8, // Reduced gap since UserGreeting has its own margin
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    padding: 16,
    borderRadius: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 14,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityDistance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityCalories: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
