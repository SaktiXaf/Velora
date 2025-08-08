import { Card } from '@/components/Card';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimeFrame = 'week' | 'month' | 'year';
type ActivityType = 'all' | 'run' | 'bike' | 'walk';

interface LeaderboardEntry {
  id: string;
  rank: number;
  user: {
    name: string;
    avatar?: string;
  };
  distance: number;
  time: number;
  activities: number; // Total number of activities
  activityType: ActivityType;
}

// Mock data dengan berbagai aktivitas
const generateMockData = (timeFrame: TimeFrame, activityType: ActivityType): LeaderboardEntry[] => {
  const baseData = [
    { name: 'Sakti Selginov', id: '1' },
    { name: 'Ahmad Dahlan', id: '2' },
    { name: 'Budi Santoso', id: '3' },
    { name: 'Citra Dewi', id: '4' },
    { name: 'Doni Pratama', id: '5' },
    { name: 'Eka Sari', id: '6' },
    { name: 'Fajar Nugroho', id: '7' },
    { name: 'Gita Purnama', id: '8' },
  ];

  const multiplier = timeFrame === 'week' ? 1 : timeFrame === 'month' ? 4 : 12;
  
  return baseData.map((user, index) => {
    let distance = 0;
    let time = 0;
    let activities = 0;

    // Generate different stats based on activity type
    switch (activityType) {
      case 'run':
        distance = (25 - index * 2) * multiplier + Math.random() * 10;
        time = distance * 300 + Math.random() * 1000; // ~5 min/km
        activities = Math.floor(distance / 8) + Math.floor(Math.random() * 3);
        break;
      case 'bike':
        distance = (60 - index * 5) * multiplier + Math.random() * 20;
        time = distance * 120 + Math.random() * 1000; // ~2 min/km
        activities = Math.floor(distance / 25) + Math.floor(Math.random() * 5);
        break;
      case 'walk':
        distance = (15 - index * 1.5) * multiplier + Math.random() * 8;
        time = distance * 720 + Math.random() * 1000; // ~12 min/km
        activities = Math.floor(distance / 5) + Math.floor(Math.random() * 4);
        break;
      default: // all
        distance = (45 - index * 3) * multiplier + Math.random() * 15;
        time = distance * 240 + Math.random() * 1000; // mixed pace
        activities = Math.floor(distance / 10) + Math.floor(Math.random() * 8);
        break;
    }

    return {
      id: user.id,
      rank: index + 1,
      user: { name: user.name },
      distance: Math.max(distance, 0),
      time: Math.max(time, 0),
      activities: Math.max(activities, 1),
      activityType,
    };
  }).sort((a, b) => b.distance - a.distance) // Sort by distance descending
    .map((item, index) => ({ ...item, rank: index + 1 })); // Update ranks
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [activityType, setActivityType] = useState<ActivityType>('all');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  // Update data when filters change
  useEffect(() => {
    const newData = generateMockData(timeFrame, activityType);
    setLeaderboardData(newData);
  }, [timeFrame, activityType]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'run': return 'footsteps-outline';
      case 'bike': return 'bicycle-outline';
      case 'walk': return 'walk-outline';
      default: return 'fitness-outline';
    }
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
    }
  };

  const renderTimeFrameButton = (value: TimeFrame, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        timeFrame === value && styles.filterButtonActive,
      ]}
      onPress={() => setTimeFrame(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          timeFrame === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderActivityTypeButton = (value: ActivityType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.activityFilterButton,
        activityType === value && styles.filterButtonActive,
      ]}
      onPress={() => setActivityType(value)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activityType === value ? Theme.colors.white : Theme.colors.textSecondary} 
      />
      <Text
        style={[
          styles.activityFilterButtonText,
          activityType === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <Card style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <View style={[
          styles.rankBadge,
          item.rank === 1 && styles.goldBadge,
          item.rank === 2 && styles.silverBadge,
          item.rank === 3 && styles.bronzeBadge,
        ]}>
          <Text style={[
            styles.rank,
            (item.rank <= 3) && styles.medalRank
          ]}>
            {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
          </Text>
        </View>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="analytics-outline" size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.statText}>{formatTime(item.time)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name={getActivityIcon(item.activityType) as any} size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.activities} activities</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>🏆 Leaderboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getTimeFrameLabel()}</Text>
        </View>
      
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Time Period</Text>
          <View style={styles.filterGroup}>
            {renderTimeFrameButton('week', 'Week')}
            {renderTimeFrameButton('month', 'Month')}
            {renderTimeFrameButton('year', 'Year')}
          </View>
          
          <Text style={styles.filterLabel}>Activity Type</Text>
          <View style={styles.filterGroup}>
            {renderActivityTypeButton('all', 'All', 'fitness-outline')}
            {renderActivityTypeButton('run', 'Run', 'footsteps-outline')}
            {renderActivityTypeButton('bike', 'Bike', 'bicycle-outline')}
            {renderActivityTypeButton('walk', 'Walk', 'walk-outline')}
          </View>
        </View>

        <FlatList
          data={leaderboardData}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
  },
  filters: {
    marginBottom: Theme.spacing.lg,
  },
  filterLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.cardBackground,
  },
  activityFilterButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
  },
  activityFilterButtonText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  filterButtonTextActive: {
    color: Theme.colors.white,
  },
  list: {
    paddingVertical: Theme.spacing.sm,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.md,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rank: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.primary,
  },
  medalRank: {
    fontSize: Theme.typography.fontSize.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  userName: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  statText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  stats: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
  },
});
