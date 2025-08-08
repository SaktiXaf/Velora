import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const exploreCategories = [
    { id: 1, title: 'Popular Routes', icon: 'map-outline', count: 25 },
    { id: 2, title: 'Challenges', icon: 'trophy-outline', count: 12 },
    { id: 3, title: 'Events', icon: 'calendar-outline', count: 8 },
    { id: 4, title: 'Communities', icon: 'people-outline', count: 15 },
  ];

  const featuredRoutes = [
    { id: 1, name: 'Pantai Parangtritis Loop', distance: '5.2 km', difficulty: 'Easy' },
    { id: 2, name: 'Borobudur Trail', distance: '12.8 km', difficulty: 'Moderate' },
    { id: 3, name: 'Merapi Base Camp', distance: '18.5 km', difficulty: 'Hard' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Temukan rute dan tantangan baru</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {exploreCategories.map((category) => (
              <TouchableOpacity key={category.id} style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
                <Ionicons name={category.icon as any} size={32} color={colors.primary} />
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>{category.count} items</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>Featured Routes</Text>
          {featuredRoutes.map((route) => (
            <TouchableOpacity key={route.id} style={styles.routeCard}>
              <View style={styles.routeIcon}>
                <Ionicons name="location-outline" size={24} color={Theme.colors.primary} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeDetails}>{route.distance} • {route.difficulty}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="search" size={24} color={Theme.colors.white} />
            <Text style={styles.actionButtonText}>Find Nearby Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Ionicons name="add-circle" size={24} color={Theme.colors.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Create Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
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
  content: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  categoriesContainer: {
    marginBottom: Theme.spacing.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
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
  },
  categoryTitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  featuredContainer: {
    marginBottom: Theme.spacing.xl,
  },
  routeCard: {
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
  },
  routeDetails: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: Theme.spacing.xl,
  },
  actionButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  actionButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.white,
    marginLeft: Theme.spacing.sm,
  },
  secondaryButtonText: {
    color: Theme.colors.primary,
  },
});
