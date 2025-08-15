import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WelcomeScreenProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function WelcomeScreen({ onSignIn, onSignUp }: WelcomeScreenProps) {
  const { colors } = useTheme();

  const features = [
    {
      icon: 'location-outline',
      title: 'Track Your Runs',
      description: 'Record distance, pace, and route with GPS tracking'
    },
    {
      icon: 'stats-chart-outline',
      title: 'Monitor Progress',
      description: 'View detailed statistics and track your improvements'
    },
    {
      icon: 'people-outline',
      title: 'Connect with Others',
      description: 'Follow friends and share your achievements'
    },
    {
      icon: 'trophy-outline',
      title: 'Achieve Goals',
      description: 'Set targets and celebrate your milestones'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
          ))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    marginVertical: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 140,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionsSection: {
    marginVertical: 20,
    gap: 16,
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
    marginTop: 20,
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
