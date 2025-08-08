import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';

interface StatisticCardProps {
  title: string;
  value: string | number;
  unit?: string;
}

export const StatisticCard = ({ title, value, unit }: StatisticCardProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>
        {value}
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  value: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.primary,
  },
  unit: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
});
