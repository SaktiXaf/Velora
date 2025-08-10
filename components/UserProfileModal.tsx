import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { followService } from '../lib/followService';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  totalActivities?: number;
  followers?: number;
  following?: number;
}

interface UserProfileModalProps {
  user: User | null;
  visible: boolean;
  onClose: () => void;
  currentUserId?: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  user, 
  visible, 
  onClose, 
  currentUserId = 'current-user' 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  
  // Use ThemeContext for consistent theming
  const { mode, colors } = useTheme();
  
  const theme = { 
    background: colors.background, 
    text: colors.text, 
    border: colors.border, 
    accent: colors.primary, 
    surface: colors.surface,
    textSecondary: colors.textSecondary,
    cardBackground: colors.white,
    overlayColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    statsBackground: mode === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(255,255,255,0.6)',
  };

  useEffect(() => {
    if (user) {
      checkFollowStatus();
      loadUserStats();
    }
  }, [user]);

  const checkFollowStatus = async () => {
    if (!user) return;
    try {
      const following = await followService.getFollowing(currentUserId);
      setIsFollowing(following.includes(user.id));
    } catch (error) {
      console.log('Error checking follow status:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const userStats = await followService.getFollowStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.log('Error loading user stats:', error);
      setStats({ followers: user.followers || 0, following: user.following || 0 });
    }
  };

  const handleFollowToggle = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(currentUserId, user.id);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        Alert.alert('Success', `You unfollowed ${user.username}`);
      } else {
        await followService.followUser(currentUserId, user.id);
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        Alert.alert('Success', `You are now following ${user.username}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.overlayColor }]}>
            <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.avatarText, { color: theme.background }]}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
              <Text style={[styles.username, { color: theme.textSecondary }]}>@{user.username}</Text>
              {user.bio && (
                <Text style={[styles.bio, { color: theme.text }]}>{user.bio}</Text>
              )}
              <Text style={[styles.memberSince, { color: theme.textSecondary }]}>
                BlueTrack Member
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <View style={[styles.statsSection, { backgroundColor: theme.statsBackground }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{stats.followers}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{user.totalActivities || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Activities</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing ? 'transparent' : theme.accent,
                borderColor: theme.accent,
              }
            ]}
            onPress={handleFollowToggle}
            disabled={loading}
          >
            <Text style={[
              styles.followButtonText,
              {
                color: isFollowing ? theme.accent : theme.background,
              }
            ]}>
              {loading ? 'Loading...' : isFollowing ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>

          {/* Recent Activities */}
          <View style={styles.activitiesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activities</Text>
            <View style={[styles.activityCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>🏃‍♂️ Morning Run</Text>
              <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>
                5.2 km • 25 min • 2 hours ago
              </Text>
            </View>
            <View style={[styles.activityCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>🚴‍♀️ Evening Workout</Text>
              <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>
                45 min • Yesterday
              </Text>
            </View>
            <View style={[styles.activityCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>🚶‍♂️ Walking</Text>
              <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>
                3.1 km • 35 min • 3 days ago
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    paddingTop: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: -20,
    marginTop: 0,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 17,
    marginBottom: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    opacity: 0.9,
    maxWidth: 280,
  },
  memberSince: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    opacity: 0.7,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 24,
    borderRadius: 20,
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  followButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  followButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activitiesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  activityCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0.5,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  activityDetails: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    lineHeight: 20,
  },
});

export default UserProfileModal;
