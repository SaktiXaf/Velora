import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { followService } from '../lib/followService';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';
import { useTheme } from '../contexts/ThemeContext';
import UserProfileModal from './UserProfileModal';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface SearchScreenProps {
  visible?: boolean;
  onClose: () => void;
  currentUserId?: string;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ 
  onClose, 
  currentUserId = 'current-user' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Use ThemeContext for consistent theming
  const { mode, colors } = useTheme();
  
  // Debug logging
  console.log('🎨 SearchScreen Theme Debug:', {
    mode,
    colors: {
      background: colors.background,
      text: colors.text,
      surface: colors.surface
    }
  });

  const theme = {
    background: colors.background,
    text: colors.text,
    border: colors.border,
    accent: colors.primary,
    surface: colors.surface,
    textSecondary: colors.textSecondary,
    cardBackground: colors.white,
    searchBackground: colors.white,
    shadowColor: colors.shadow,
    overlayColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch();
    } else {
      // Show all users when no search query
      handleGetAllUsers();
    }
  }, [searchQuery]);

  // Load all users when component mounts
  useEffect(() => {
    handleGetAllUsers();
  }, []);

  const handleGetAllUsers = async () => {
    console.log('👥 Loading all users...');
    setLoading(true);
    try {
      const results = await followService.getAllUsers();
      const following = await followService.getFollowing(currentUserId);
      
      // Filter out current user and add follow status
      const filteredResults = results
        .filter(user => user.id !== currentUserId) // Remove current user
        .map(user => ({
          ...user,
          isFollowing: following.includes(user.id),
        }));
      
      console.log('✅ Loaded all users (excluding self):', filteredResults);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('❌ Error loading all users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('🔍 Starting search with query:', searchQuery);
    
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      console.log('📞 Calling followService.searchUsers...');
      const results = await followService.searchUsers(searchQuery);
      console.log('📋 Search results:', results);
      
      const following = await followService.getFollowing(currentUserId);
      console.log('👥 Current following:', following);
      
      // Filter out current user and add follow status
      const filteredResults = results
        .filter(user => user.id !== currentUserId) // Remove current user
        .map(user => ({
          ...user,
          isFollowing: following.includes(user.id),
        }));
      
      console.log('✅ Final search results (excluding self):', filteredResults);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user: User) => {
    try {
      if (user.isFollowing) {
        await followService.unfollowUser(currentUserId, user.id);
        Alert.alert('Success', `You unfollowed ${user.username}`);
      } else {
        await followService.followUser(currentUserId, user.id);
        Alert.alert('Success', `You are now following ${user.username}`);
      }
      
      // Update local state
      setSearchResults(prev =>
        prev.map(u => 
          u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setProfileModalVisible(true);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem, 
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        }
      ]}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar, { backgroundColor: theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.background }]}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
          <Text style={[styles.name, { color: theme.textSecondary }]}>{item.name}</Text>
          {item.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.followButton,
          {
            backgroundColor: item.isFollowing ? 'transparent' : theme.accent,
            borderColor: theme.accent,
          }
        ]}
        onPress={() => handleFollowToggle(item)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.followButtonText,
          {
            color: item.isFollowing ? theme.accent : theme.background,
          }
        ]}>
          {item.isFollowing ? '✓ Following' : '+ Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.overlayColor }]}>
            <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Search Users</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.searchBackground,
                    color: theme.text,
                    borderColor: searchQuery.length > 0 ? theme.accent : theme.border,
                  }
                ]}
                placeholder="🔍 Search users..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 12,
                    padding: 4,
                  }}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Results Count */}
            {searchResults.length > 0 && (
              <Text style={[
                { 
                  color: theme.textSecondary, 
                  fontSize: 12, 
                  marginTop: 8,
                  textAlign: 'center',
                  fontWeight: '500'
                }
              ]}>
                {searchQuery.length > 0 
                  ? `Found ${searchResults.length} users matching "${searchQuery}"`
                  : `${searchResults.length} users in BlueTrack community`
                }
              </Text>
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <Text style={{ fontSize: 24, marginBottom: 12 }}>🔍</Text>
                <Text style={[styles.messageText, { color: theme.textSecondary }]}>
                  Searching for users...
                </Text>
              </View>
            ) : searchQuery.length === 0 ? (
              searchResults.length === 0 && !loading ? (
                <View style={styles.centerContainer}>
                  <Text style={{ fontSize: 24, marginBottom: 12 }}>👥</Text>
                  <Text style={[styles.messageText, { color: theme.text, fontSize: 18, fontWeight: '600' }]}>
                    Loading Users...
                  </Text>
                  <Text style={[styles.messageText, { color: theme.textSecondary, marginTop: 8 }]}>
                    Discovering BlueTrack community
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  style={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              )
            ) : searchResults.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={{ fontSize: 36, marginBottom: 16, opacity: 0.6 }}>🔍</Text>
                <Text style={[styles.messageText, { color: theme.text, fontWeight: '600' }]}>
                  No users found
                </Text>
                <Text style={[styles.messageText, { color: theme.textSecondary, marginTop: 8 }]}>
                  Try searching with a different name or username
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            )}
          </View>
        </SafeAreaView>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        visible={profileModalVisible}
        onClose={() => {
          setProfileModalVisible(false);
          setSelectedUser(null);
        }}
        currentUserId={currentUserId}
      />
    </>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '500',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.8,
  },
  bio: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
    lineHeight: 18,
  },
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 90,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SearchScreen;
