import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';
import { supabase, testSupabaseConnection } from './supabase';

export interface FollowStats {
  followers: number;
  following: number;
}

// Import the emitter from useFollowStats
let followStatsEmitter: any = null;

// Function to set the emitter reference
export const setFollowStatsEmitter = (emitter: any) => {
  followStatsEmitter = emitter;
};

export class FollowService {
  private static instance: FollowService;

  public static getInstance(): FollowService {
    if (!FollowService.instance) {
      FollowService.instance = new FollowService();
    }
    return FollowService.instance;
  }

  // Get storage keys per user
  private getFollowsKey(userId: string): string {
    return `user_follows_${userId}`;
  }

  private getStatsKey(userId: string): string {
    return `user_stats_${userId}`;
  }

  // Get mock follows from AsyncStorage
  private async getMockFollows(userId: string): Promise<string[]> {
    try {
      const followsKey = this.getFollowsKey(userId);
      const follows = await AsyncStorage.getItem(followsKey);
      return follows ? JSON.parse(follows) : [];
    } catch (error) {
      console.error('Error getting mock follows:', error);
      return [];
    }
  }

  // Save mock follows to AsyncStorage
  private async saveMockFollows(userId: string, follows: string[]): Promise<void> {
    try {
      const followsKey = this.getFollowsKey(userId);
      await AsyncStorage.setItem(followsKey, JSON.stringify(follows));
    } catch (error) {
      console.error('Error saving mock follows:', error);
    }
  }

  // Get mock stats from AsyncStorage
  private async getMockStats(userId: string): Promise<FollowStats> {
    try {
      const statsKey = this.getStatsKey(userId);
      const stats = await AsyncStorage.getItem(statsKey);
      return stats ? JSON.parse(stats) : { followers: 0, following: 0 };
    } catch (error) {
      console.error('Error getting mock stats:', error);
      return { followers: 0, following: 0 };
    }
  }

  // Save mock stats to AsyncStorage
  private async saveMockStats(userId: string, stats: FollowStats): Promise<void> {
    try {
      const statsKey = this.getStatsKey(userId);
      await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving mock stats:', error);
    }
  }

  // Check if following a user
  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const follows = await this.getMockFollows(currentUserId);
      return follows.includes(targetUserId);
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Follow a user
  async followUser(currentUserId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`${currentUserId} following user: ${targetUserId}`);
      
      // Prevent self-follow
      if (currentUserId === targetUserId) {
        return { success: false, message: 'Cannot follow yourself' };
      }
      
      // Check if already following
      const isAlreadyFollowing = await this.isFollowing(currentUserId, targetUserId);
      if (isAlreadyFollowing) {
        return { success: false, message: 'Already following this user' };
      }

      // Add to current user's following list
      const follows = await this.getMockFollows(currentUserId);
      follows.push(targetUserId);
      await this.saveMockFollows(currentUserId, follows);

      // Update current user's following count
      const currentUserStats = await this.getMockStats(currentUserId);
      currentUserStats.following += 1;
      await this.saveMockStats(currentUserId, currentUserStats);

      // Update target user's followers count
      const targetUserStats = await this.getMockStats(targetUserId);
      targetUserStats.followers += 1;
      await this.saveMockStats(targetUserId, targetUserStats);

      console.log(`✅ Follow successful:`, {
        currentUser: currentUserId,
        currentUserStats,
        targetUser: targetUserId,
        targetUserStats
      });
      
      // Add follow notification to target user
      try {
        // In a real app, you'd get the follower's username from user profile
        const followerUsername = `user_${currentUserId.slice(-4)}`; // Mock username
        await notificationService.addFollowNotification(targetUserId, followerUsername);
        console.log('📱 Follow notification sent to:', targetUserId);
      } catch (error) {
        console.error('Error sending follow notification:', error);
      }
      
      // Trigger stats update for both users
      await this.triggerStatsUpdate(currentUserId);
      await this.triggerStatsUpdate(targetUserId);
      
      return { success: true, message: 'Successfully followed user' };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, message: 'Failed to follow user' };
    }
  }

  // Unfollow a user
  async unfollowUser(currentUserId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`${currentUserId} unfollowing user: ${targetUserId}`);
      
      // Prevent self-unfollow
      if (currentUserId === targetUserId) {
        return { success: false, message: 'Cannot unfollow yourself' };
      }
      
      // Check if currently following
      const isCurrentlyFollowing = await this.isFollowing(currentUserId, targetUserId);
      if (!isCurrentlyFollowing) {
        return { success: false, message: 'Not following this user' };
      }

      // Remove from current user's following list
      const follows = await this.getMockFollows(currentUserId);
      const updatedFollows = follows.filter(id => id !== targetUserId);
      await this.saveMockFollows(currentUserId, updatedFollows);

      // Update current user's following count
      const currentUserStats = await this.getMockStats(currentUserId);
      currentUserStats.following = Math.max(0, currentUserStats.following - 1);
      await this.saveMockStats(currentUserId, currentUserStats);

      // Update target user's followers count
      const targetUserStats = await this.getMockStats(targetUserId);
      targetUserStats.followers = Math.max(0, targetUserStats.followers - 1);
      await this.saveMockStats(targetUserId, targetUserStats);

      console.log(`✅ Unfollow successful:`, {
        currentUser: currentUserId,
        currentUserStats,
        targetUser: targetUserId,
        targetUserStats
      });
      
      // Trigger stats update for both users
      await this.triggerStatsUpdate(currentUserId);
      await this.triggerStatsUpdate(targetUserId);
      
      return { success: true, message: 'Successfully unfollowed user' };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, message: 'Failed to unfollow user' };
    }
  }

  // Get follow stats for a user
  async getFollowStats(userId: string): Promise<FollowStats> {
    try {
      return await this.getMockStats(userId);
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return { followers: 0, following: 0 };
    }
  }

  // Get list of users being followed
  async getFollowing(userId: string): Promise<string[]> {
    try {
      return await this.getMockFollows(userId);
    } catch (error) {
      console.error('Error getting following list:', error);
      return [];
    }
  }

  // Debug method to check service status
  async debugStatus(userId: string): Promise<void> {
    try {
      const follows = await this.getMockFollows(userId);
      const stats = await this.getMockStats(userId);
      console.log(`Follow Service Debug for user ${userId}:`);
      console.log('- Following:', follows);
      console.log('- Stats:', stats);
    } catch (error) {
      console.error('Error in debug status:', error);
    }
  }

  // Clear all follow data for a user (for testing)
  async clearUserData(userId: string): Promise<void> {
    try {
      const followsKey = this.getFollowsKey(userId);
      const statsKey = this.getStatsKey(userId);
      await AsyncStorage.removeItem(followsKey);
      await AsyncStorage.removeItem(statsKey);
      console.log(`All follow data cleared for user: ${userId}`);
    } catch (error) {
      console.error('Error clearing follow data:', error);
    }
  }

  // Get detailed followers list (with user info)
  async getFollowersList(userId: string): Promise<any[]> {
    try {
      console.log(`🔍 Getting real followers for user: ${userId}`);
      
      // First, try to get followers from Supabase database
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        console.log('📡 Using Supabase to fetch real followers...');
        
        // Query the follows table to get users who follow this user
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
        
        if (followsError) {
          console.error('❌ Error fetching follows from Supabase (table may not exist):', followsError);
          console.log('🔄 Using sample followers instead...');
          return this.getSampleUsersAsFollowers();
        }
        
        if (!followsData || followsData.length === 0) {
          console.log('📋 No followers found in database, fetching sample users instead...');
          return this.getSampleUsersAsFollowers();
        }
        
        // Get the follower user IDs
        const followerIds = followsData.map(follow => follow.follower_id);
        console.log(`📋 Found ${followerIds.length} follower IDs:`, followerIds);
        
        // Fetch user details for each follower
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, bio, avatar, created_at')
          .in('id', followerIds);
        
        if (usersError) {
          console.error('❌ Error fetching user details from Supabase (users table may not exist):', usersError);
          console.log('🔄 Using sample followers instead...');
          return this.getSampleUsersAsFollowers();
        }
        
        // Format the user data
        const followers = usersData.map(user => ({
          id: user.id,
          name: user.name || 'Unknown User',
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0066cc&color=fff`,
          bio: user.bio || 'BlueTrack user'
        }));
        
        console.log(`✅ Successfully loaded ${followers.length} real followers:`, followers);
        return followers;
        
      } else {
        console.log('🔄 Supabase not available, using fallback...');
        return this.getFallbackFollowers(userId);
      }
    } catch (error) {
      console.error('❌ Error getting followers list:', error);
      return this.getFallbackFollowers(userId);
    }
  }

  // Get sample users from the users table as followers (when no real follows exist)
  private async getSampleUsersAsFollowers(): Promise<any[]> {
    try {
      console.log('🎲 Fetching sample users as followers...');
      
      // Check if users table exists first
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar, created_at')
        .limit(5)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching sample users (table may not exist):', error);
        console.log('🔄 Falling back to mock sample followers...');
        return this.getMockSampleFollowers();
      }
      
      if (!usersData || usersData.length === 0) {
        console.log('📋 No users found in database, using mock sample followers...');
        return this.getMockSampleFollowers();
      }
      
      const sampleFollowers = usersData.map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0066cc&color=fff`,
        bio: user.bio || 'BlueTrack user'
      }));
      
      console.log(`✅ Found ${sampleFollowers.length} sample users as followers:`, sampleFollowers);
      return sampleFollowers;
      
    } catch (error) {
      console.error('❌ Error fetching sample users:', error);
      console.log('🔄 Using mock sample followers as final fallback...');
      return this.getMockSampleFollowers();
    }
  }

  // Mock sample followers when database is not available
  private getMockSampleFollowers(): any[] {
    const mockFollowers = [
      {
        id: 'sample_user_1',
        name: 'Alex Runner',
        username: 'alex_runner',
        avatar: 'https://ui-avatars.com/api/?name=Alex%20Runner&background=0066cc&color=fff',
        bio: 'Marathon enthusiast and BlueTrack user'
      },
      {
        id: 'sample_user_2',
        name: 'Maria Fitness',
        username: 'maria_fit',
        avatar: 'https://ui-avatars.com/api/?name=Maria%20Fitness&background=cc0066&color=fff',
        bio: 'Fitness trainer who loves tracking workouts'
      },
      {
        id: 'sample_user_3',
        name: 'John Cyclist',
        username: 'john_bikes',
        avatar: 'https://ui-avatars.com/api/?name=John%20Cyclist&background=00cc66&color=fff',
        bio: 'Cycling enthusiast and weekend warrior'
      },
      {
        id: 'sample_user_4',
        name: 'Sarah Walker',
        username: 'sarah_walks',
        avatar: 'https://ui-avatars.com/api/?name=Sarah%20Walker&background=cc6600&color=fff',
        bio: 'Daily walker and health advocate'
      }
    ];
    
    console.log(`🎭 Generated ${mockFollowers.length} mock sample followers`);
    return mockFollowers;
  }

  // Fallback method for when Supabase is not available
  private async getFallbackFollowers(userId: string): Promise<any[]> {
    try {
      console.log('📱 Using AsyncStorage fallback for followers...');
      
      // Get mock followers (users who follow this user)
      const followersKey = `user_followers_${userId}`;
      const followersData = await AsyncStorage.getItem(followersKey);
      let followerIds: string[] = [];
      
      if (followersData) {
        followerIds = JSON.parse(followersData);
      } else {
        // Create some realistic mock followers for testing
        const mockFollowerIds = [
          'user_001',
          'user_002', 
          'user_003',
          'user_004'
        ];
        followerIds = mockFollowerIds;
        
        // Save mock followers
        await AsyncStorage.setItem(followersKey, JSON.stringify(mockFollowerIds));
        console.log(`📝 Created fallback followers for user ${userId}:`, mockFollowerIds);
      }
      
      // Convert follower IDs to user objects with realistic details
      const followerUsers = followerIds.map((id, index) => ({
        id,
        name: `User ${index + 1}`,
        username: `user${index + 1}`,
        avatar: `https://ui-avatars.com/api/?name=User%20${index + 1}&background=0066cc&color=fff`,
        bio: `Active BlueTrack user #${index + 1}`
      }));
      
      console.log(`📋 Fallback: Found ${followerUsers.length} followers for user ${userId}`);
      return followerUsers;
    } catch (error) {
      console.error('❌ Error in fallback followers:', error);
      return [];
    }
  }

  // Get detailed following list (with user info)
  async getFollowingList(userId: string): Promise<any[]> {
    try {
      console.log(`🔍 Getting real following list for user: ${userId}`);
      
      // First, try to get following from Supabase database
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        console.log('📡 Using Supabase to fetch real following...');
        
        // Query the follows table to get users this user is following
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        if (followsError) {
          console.error('❌ Error fetching following from Supabase (table may not exist):', followsError);
          console.log('🔄 Using sample following instead...');
          return this.getSampleUsersAsFollowing();
        }
        
        if (!followsData || followsData.length === 0) {
          console.log('📋 No following found in database, fetching sample users instead...');
          return this.getSampleUsersAsFollowing();
        }
        
        // Get the following user IDs
        const followingIds = followsData.map(follow => follow.following_id);
        console.log(`📋 Found ${followingIds.length} following IDs:`, followingIds);
        
        // Fetch user details for each following
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, bio, avatar, created_at')
          .in('id', followingIds);
        
        if (usersError) {
          console.error('❌ Error fetching user details from Supabase (users table may not exist):', usersError);
          console.log('🔄 Using sample following instead...');
          return this.getSampleUsersAsFollowing();
        }
        
        // Format the user data
        const following = usersData.map(user => ({
          id: user.id,
          name: user.name || 'Unknown User',
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=009900&color=fff`,
          bio: user.bio || 'BlueTrack user'
        }));
        
        console.log(`✅ Successfully loaded ${following.length} real following:`, following);
        return following;
        
      } else {
        console.log('🔄 Supabase not available, using fallback...');
        return this.getFallbackFollowing(userId);
      }
    } catch (error) {
      console.error('❌ Error getting following list:', error);
      return this.getFallbackFollowing(userId);
    }
  }

  // Get sample users from the users table as following (when no real follows exist)
  private async getSampleUsersAsFollowing(): Promise<any[]> {
    try {
      console.log('🎲 Fetching sample users as following...');
      
      // Check if users table exists first
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar, created_at')
        .limit(3)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching sample users for following (table may not exist):', error);
        console.log('🔄 Falling back to mock sample following...');
        return this.getMockSampleFollowing();
      }
      
      if (!usersData || usersData.length === 0) {
        console.log('📋 No users found in database, using mock sample following...');
        return this.getMockSampleFollowing();
      }
      
      const sampleFollowing = usersData.map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=009900&color=fff`,
        bio: user.bio || 'BlueTrack user'
      }));
      
      console.log(`✅ Found ${sampleFollowing.length} sample users as following:`, sampleFollowing);
      return sampleFollowing;
      
    } catch (error) {
      console.error('❌ Error fetching sample users for following:', error);
      console.log('🔄 Using mock sample following as final fallback...');
      return this.getMockSampleFollowing();
    }
  }

  // Mock sample following when database is not available
  private getMockSampleFollowing(): any[] {
    const mockFollowing = [
      {
        id: 'following_user_1',
        name: 'David Coach',
        username: 'david_coach',
        avatar: 'https://ui-avatars.com/api/?name=David%20Coach&background=009900&color=fff',
        bio: 'Professional fitness coach'
      },
      {
        id: 'following_user_2',
        name: 'Emma Runner',
        username: 'emma_runs',
        avatar: 'https://ui-avatars.com/api/?name=Emma%20Runner&background=990099&color=fff',
        bio: 'Ultra marathon runner'
      },
      {
        id: 'following_user_3',
        name: 'Mike Trainer',
        username: 'mike_train',
        avatar: 'https://ui-avatars.com/api/?name=Mike%20Trainer&background=999900&color=fff',
        bio: 'Personal trainer and motivator'
      }
    ];
    
    console.log(`🎭 Generated ${mockFollowing.length} mock sample following`);
    return mockFollowing;
  }

  // Fallback method for following when Supabase is not available
  private async getFallbackFollowing(userId: string): Promise<any[]> {
    try {
      console.log('📱 Using AsyncStorage fallback for following...');
      
      const followingIds = await this.getMockFollows(userId);
      console.log(`📋 Fallback following IDs for user ${userId}:`, followingIds);
      
      // Convert following IDs to user objects with realistic details
      const followingUsers = followingIds.map((id, index) => ({
        id,
        name: `Following User ${index + 1}`,
        username: `following${index + 1}`,
        avatar: `https://ui-avatars.com/api/?name=Following%20User%20${index + 1}&background=009900&color=fff`,
        bio: `User I'm following #${index + 1}`
      }));
      
      console.log(`📋 Fallback: Found ${followingUsers.length} following for user ${userId}`);
      return followingUsers;
    } catch (error) {
      console.error('❌ Error in fallback following:', error);
      return [];
    }
  }

  // Trigger stats update for real-time UI refresh
  private async triggerStatsUpdate(userId: string): Promise<void> {
    try {
      console.log(`🔔 Triggering stats update for user: ${userId}`);
      
      // Get updated stats from storage
      const updatedStats = await this.getFollowStats(userId);
      console.log(`� Updated stats for ${userId}:`, updatedStats);
      
      // If emitter is available, use it to notify subscribers
      if (followStatsEmitter) {
        await followStatsEmitter.updateStats(userId);
      } else {
        console.log('⚠️ followStatsEmitter not available, stats update may not be reflected in UI');
      }
    } catch (error) {
      console.error('Error triggering stats update:', error);
    }
  }

  // Search users (with Supabase integration and mock fallback)
  async searchUsers(query: string): Promise<any[]> {
    console.log('🔍 FollowService.searchUsers called with query:', query);
    
    try {
      // Test Supabase connection first
      const connectionTest = await testSupabaseConnection();
      
      if (connectionTest.success) {
        // Search from Supabase users
        console.log('📡 Searching users from Supabase...');
        
        let supabaseQuery = supabase
          .from('users')
          .select('id, name, email, bio, avatar, created_at');
        
        // If query is provided, filter by name or email
        if (query.trim()) {
          supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
        }
        
        const { data: profiles, error } = await supabaseQuery.limit(20);
        
        if (error) {
          console.error('❌ Supabase search error:', error);
          return this.getMockUsers(query);
        }
        
        if (profiles && profiles.length > 0) {
          console.log(`✅ Found ${profiles.length} users from Supabase`);
          
          // Transform Supabase data to expected format (without email for privacy)
          return profiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Unknown User',
            username: profile.email?.split('@')[0] || profile.id.slice(0, 8),
            avatar: profile.avatar || `https://picsum.photos/200/200?random=${profile.id}`,
            bio: profile.bio || 'BlueTrack user',
            totalActivities: Math.floor(Math.random() * 50) + 1, // Mock activity count
          }));
        } else {
          console.log('📭 No users found in Supabase, using mock data');
          return this.getMockUsers(query);
        }
      } else {
        console.log('📱 Supabase connection failed, using mock data:', connectionTest.error);
        return this.getMockUsers(query);
      }
    } catch (error) {
      console.error('❌ Error in searchUsers:', error);
      return this.getMockUsers(query);
    }
  }

  // Get mock users for offline/fallback mode
  private getMockUsers(query: string): any[] {
    const mockUsers = [
      { id: 'user1', name: 'John Doe', username: 'johndoe', avatar: 'https://picsum.photos/200/200?random=1', bio: 'Fitness enthusiast', totalActivities: 25 },
      { id: 'user2', name: 'Jane Smith', username: 'janesmith', avatar: 'https://picsum.photos/200/200?random=2', bio: 'Runner and cyclist', totalActivities: 42 },
      { id: 'user3', name: 'Mike Johnson', username: 'mikej', avatar: 'https://picsum.photos/200/200?random=3', bio: 'Gym lover', totalActivities: 18 },
      { id: 'user4', name: 'Sarah Wilson', username: 'sarahw', avatar: 'https://picsum.photos/200/200?random=4', bio: 'Yoga instructor', totalActivities: 35 },
      { id: 'user5', name: 'Tom Brown', username: 'tomb', avatar: 'https://picsum.photos/200/200?random=5', bio: 'Marathon runner', totalActivities: 67 },
      { id: 'user6', name: 'Lisa Davis', username: 'lisad', avatar: 'https://picsum.photos/200/200?random=6', bio: 'Crossfit athlete', totalActivities: 29 },
      { id: 'user7', name: 'Alex Chen', username: 'alexc', avatar: 'https://picsum.photos/200/200?random=7', bio: 'Cycling enthusiast', totalActivities: 55 },
      { id: 'user8', name: 'Emma Wilson', username: 'emmaw', avatar: 'https://picsum.photos/200/200?random=8', bio: 'Fitness coach', totalActivities: 88 },
      { id: 'user9', name: 'David Lee', username: 'davidl', avatar: 'https://picsum.photos/200/200?random=9', bio: 'Rock climber', totalActivities: 31 },
      { id: 'user10', name: 'Sophie Martin', username: 'sophiem', avatar: 'https://picsum.photos/200/200?random=10', bio: 'Swimming coach', totalActivities: 46 },
    ];

    if (!query.trim()) {
      console.log('📋 Empty query, returning all mock users:', mockUsers);
      return mockUsers;
    }

    const filteredUsers = mockUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.bio.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('📋 Filtered mock users:', filteredUsers);
    return filteredUsers;
  }

  // Get all registered users
  async getAllUsers(): Promise<any[]> {
    console.log('👥 Getting all registered users...');
    
    try {
      // Test Supabase connection first
      const connectionTest = await testSupabaseConnection();
      
      if (connectionTest.success) {
        console.log('📡 Fetching all users from Supabase...');
        
        const { data: profiles, error } = await supabase
          .from('users')
          .select('id, name, email, bio, avatar, created_at')
          .limit(50); // Limit to prevent too much data
        
        if (error) {
          console.error('❌ Supabase fetch error:', error);
          return this.getMockUsers('');
        }
        
        if (profiles && profiles.length > 0) {
          console.log(`✅ Found ${profiles.length} total users from Supabase`);
          
          // Transform Supabase data to expected format (without email for privacy)
          return profiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Unknown User',
            username: profile.email?.split('@')[0] || profile.id.slice(0, 8),
            avatar: profile.avatar || `https://picsum.photos/200/200?random=${profile.id}`,
            bio: profile.bio || 'BlueTrack user',
            totalActivities: Math.floor(Math.random() * 50) + 1,
          }));
        } else {
          console.log('📭 No users found in Supabase, using mock data');
          return this.getMockUsers('');
        }
      } else {
        console.log('📱 Supabase connection failed, using mock data:', connectionTest.error);
        return this.getMockUsers('');
      }
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      return this.getMockUsers('');
    }
  }
}

// Export singleton instance
export const followService = FollowService.getInstance();
