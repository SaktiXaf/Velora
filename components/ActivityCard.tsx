import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { Card } from './Card';

interface ActivityCardProps {
  type: 'run' | 'bike' | 'walk';
  distance: number;
  duration: string;
  date: string;
  user: {
    name: string;
    avatar?: string;
  };
  kudos: number;
  comments: number;
  onPress: () => void;
}

export const ActivityCard = ({
  type,
  distance,
  duration,
  date,
  user,
  kudos,
  comments,
  onPress,
}: ActivityCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {/* Add avatar component here */}
            </View>
            <View>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.date}>{date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.distance}>{distance.toFixed(2)} km</Text>
            <Text style={styles.duration}>{duration}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.interaction}>
            <Text style={styles.interactionText}>{kudos} kudos</Text>
          </View>
          <View style={styles.interaction}>
            <Text style={styles.interactionText}>{comments} comments</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.border,
    marginRight: Theme.spacing.sm,
  },
  name: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.text,
  },
  date: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  content: {
    marginBottom: Theme.spacing.md,
  },
  type: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.text,
    marginRight: Theme.spacing.md,
  },
  duration: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
  },
  interaction: {
    marginRight: Theme.spacing.lg,
  },
  interactionText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
});
