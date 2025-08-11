import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { followService } from '../lib/followService';

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface FollowListModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
}

const FollowListModal: React.FC<FollowListModalProps> = ({
  visible,
  onClose,
  userId,
  type,
  title,
}) => {
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const theme = {
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    primary: colors.primary,
  };

  useEffect(() => {
    if (visible && userId) {
      loadUsers();
    }
  }, [visible, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log(`📋 Loading ${type} for user:`, userId);
      
      let userList: User[] = [];
      if (type === 'followers') {
        userList = await followService.getFollowersList(userId);
      } else {
        userList = await followService.getFollowingList(userId);
      }
      
      console.log(`📋 Loaded ${userList.length} ${type}:`, userList);
      setUsers(userList);
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { 
        backgroundColor: theme.surface,
        borderBottomColor: theme.border 
      }]}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.background }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.username, { color: theme.textSecondary }]}>@{item.username}</Text>
          {item.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>
        {type === 'followers' ? '👥' : '🫂'}
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {type === 'followers' ? 'No Followers Yet' : 'Not Following Anyone Yet'}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        {type === 'followers' 
          ? 'When people follow you, they will appear here'
          : 'Find and follow other users to see them here'
        }
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: theme.surface,
          borderBottomColor: theme.border 
        }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading {type}...
            </Text>
          </View>
        ) : users.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 2,
  },
  bio: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FollowListModal;
