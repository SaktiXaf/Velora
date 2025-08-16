import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WelcomeScreenProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function WelcomeScreen({ onSignIn, onSignUp }: WelcomeScreenProps) {
  const { colors } = useTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
      alwaysBounceVertical={true}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name="fitness" size={48} color={colors.white} />
        </View>
        
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>
          Welcome to Velora
        </Text>
        
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Your personal fitness companion for tracking runs, rides, and achieving your goals
        </Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={[styles.featuresTitle, { color: colors.text }]}>
          Why Choose Velora?
        </Text>
        
        <View style={styles.featuresGrid}>
          {/* Row 1 */}
          <View style={styles.featuresRow}>
            <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="location-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Track Your Runs
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Record distance, pace, and route with GPS tracking
              </Text>
            </View>
            
            <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="stats-chart-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Monitor Progress
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                View detailed statistics and track your improvements
              </Text>
            </View>
          </View>
          
          {/* Row 2 */}
          <View style={styles.featuresRow}>
            <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Connect with Others
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Follow friends and share your achievements
              </Text>
            </View>
            
            <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="trophy-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Achieve Goals
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Set targets and celebrate your milestones
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onSignUp}
        >
          <Text style={[styles.primaryButtonText, { color: colors.white }]}>
            Get Started
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onSignIn}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Preview */}
      <View style={[styles.statsPreview, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Join thousands of active users
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>10K+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Users</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>50K+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts Tracked</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>1M+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KM Covered</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  featuresSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  featureDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  actionsSection: {
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsPreview: {
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 0,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
