import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface UserGreetingProps {
  userName: string;
  userAvatar?: string | null;
}

export default function UserGreeting({ userName, userAvatar }: UserGreetingProps) {
  const { colors } = useTheme();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const time = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });

      setCurrentTime(time);

      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 1000); // Update every second for real-time

    return () => clearInterval(interval);
  }, []);

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'sunny-outline';
    } else if (hour >= 12 && hour < 17) {
      return 'partly-sunny-outline';
    } else if (hour >= 17 && hour < 21) {
      return 'moon-outline';
    } else {
      return 'moon';
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready for today's challenge?",
      "Let's crush your goals!",
      "Every step counts!",
      "Your fitness journey continues!",
      "Time to get moving!",
      "Make today count!",
      "Push your limits!",
      "Stay strong, stay active!"
    ];
    
    // Use userName length to get consistent message for user
    const index = userName.length % messages.length;
    return messages[index];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Ionicons 
              name={getGreetingIcon()} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              {greeting}
            </Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {currentTime}
            </Text>
          </View>
          
          <Text style={[styles.userNameText, { color: colors.text }]}>
            {userName}
          </Text>
          
          <Text style={[styles.motivationText, { color: colors.primary }]}>
            {getMotivationalMessage()}
          </Text>
        </View>

        <View style={styles.avatarSection}>
          {userAvatar ? (
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            </View>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.white }]}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Ionicons name="flame-outline" size={16} color={colors.error} />
          <Text style={[styles.quickStatText, { color: colors.textSecondary }]}>
            Streak
          </Text>
        </View>
        
        <View style={styles.quickStat}>
          <Ionicons name="trophy-outline" size={16} color={colors.warning} />
          <Text style={[styles.quickStatText, { color: colors.textSecondary }]}>
            Goals
          </Text>
        </View>
        
        <View style={styles.quickStat}>
          <Ionicons name="heart-outline" size={16} color={colors.error} />
          <Text style={[styles.quickStatText, { color: colors.textSecondary }]}>
            Health
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingSection: {
    flex: 1,
    marginRight: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
