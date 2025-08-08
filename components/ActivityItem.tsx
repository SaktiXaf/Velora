import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Activity, activityService } from '@/lib/activityService';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActivityItemProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

const ActivityItem = memo(({ activity, onPress }: ActivityItemProps) => {
  const { colors } = useTheme();

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'run':
        return 'Running';
      case 'bike':
        return 'Cycling';
      case 'walk':
        return 'Walking';
      default:
        return 'Activity';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress?.(activity)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.activityInfo}>
          <View style={[styles.iconContainer, { backgroundColor: activityService.getActivityColor(activity.type) }]}>
            <Ionicons
              name={activityService.getActivityIcon(activity.type) as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>
              {getActivityTypeLabel(activity.type)}
            </Text>
            <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
              {activityService.formatDate(activity.date)}
            </Text>
          </View>
        </View>
        <View style={styles.distanceContainer}>
          <Text style={[styles.distance, { color: colors.text }]}>
            {activity.distance.toFixed(2)}
          </Text>
          <Text style={[styles.distanceUnit, { color: colors.textSecondary }]}>km</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {activityService.formatDuration(activity.duration)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {activity.pace.toFixed(1)} min/km
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {activity.calories} cal
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  activityDate: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    marginTop: Theme.spacing.xs,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  distanceUnit: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    marginLeft: Theme.spacing.xs,
  },
});

ActivityItem.displayName = 'ActivityItem';

export default ActivityItem;
