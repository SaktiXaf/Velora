import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RealTimeClockProps {
  showSeconds?: boolean;
  showDate?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function RealTimeClock({ 
  showSeconds = true, 
  showDate = false, 
  size = 'medium',
  style 
}: RealTimeClockProps) {
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Format time with or without seconds
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      if (showSeconds) {
        timeOptions.second = '2-digit';
      }

      const time = now.toLocaleTimeString('en-US', timeOptions);
      setCurrentTime(time);

      // Format date
      if (showDate) {
        const date = now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setCurrentDate(date);
      }

      // Update greeting based on time
      if (hour >= 5 && hour < 12) {
        setGreeting('morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('afternoon');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('evening');
      } else {
        setGreeting('night');
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000); // Update every second

    return () => clearInterval(interval);
  }, [showSeconds, showDate]);

  const getGreetingIcon = () => {
    switch (greeting) {
      case 'morning':
        return 'sunny-outline';
      case 'afternoon':
        return 'partly-sunny-outline';
      case 'evening':
        return 'moon-outline';
      case 'night':
        return 'moon';
      default:
        return 'time-outline';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          timeText: { fontSize: 14, fontWeight: '500' as const },
          dateText: { fontSize: 12 },
          icon: 16
        };
      case 'large':
        return {
          timeText: { fontSize: 24, fontWeight: 'bold' as const },
          dateText: { fontSize: 16 },
          icon: 28
        };
      default: // medium
        return {
          timeText: { fontSize: 18, fontWeight: '600' as const },
          dateText: { fontSize: 14 },
          icon: 20
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.clockRow}>
        <Ionicons 
          name={getGreetingIcon()} 
          size={sizeStyles.icon} 
          color={colors.primary} 
          style={styles.icon}
        />
        <Text style={[styles.timeText, sizeStyles.timeText, { color: colors.text }]}>
          {currentTime}
        </Text>
      </View>
      
      {showDate && currentDate && (
        <Text style={[styles.dateText, sizeStyles.dateText, { color: colors.textSecondary }]}>
          {currentDate}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  timeText: {
    fontFamily: 'monospace', // Use monospace font for consistent digit spacing
  },
  dateText: {
    marginTop: 4,
    textAlign: 'center',
  },
});
