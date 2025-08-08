import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ActivityType = 'run' | 'bike' | 'walk';

interface ActivityTypeSelectorProps {
  selectedType: ActivityType;
  onTypeChange: (type: ActivityType) => void;
}

const activityTypes: { type: ActivityType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { type: 'run', icon: 'walk', label: 'Run' },
  { type: 'bike', icon: 'bicycle', label: 'Bike' },
  { type: 'walk', icon: 'walk-outline', label: 'Walk' },
];

export default function ActivityTypeSelector({ selectedType, onTypeChange }: ActivityTypeSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Activity Type</Text>
      <View style={styles.typeButtons}>
        {activityTypes.map((activity) => (
          <TouchableOpacity
            key={activity.type}
            style={[
              styles.typeButton,
              selectedType === activity.type
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => onTypeChange(activity.type)}
          >
            <Ionicons
              name={activity.icon}
              size={24}
              color={selectedType === activity.type ? colors.surface : colors.text}
            />
            <Text
              style={[
                styles.typeLabel,
                {
                  color: selectedType === activity.type ? colors.surface : colors.text,
                },
              ]}
            >
              {activity.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginHorizontal: Theme.spacing.xs,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    marginLeft: Theme.spacing.xs,
  },
});
