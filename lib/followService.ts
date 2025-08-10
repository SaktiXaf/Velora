import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, DatabaseUser, testSupabaseConnection } from './supabase';

export interface FollowStats {
  followers: number;
  following: number;
}

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
      
      // Check if already following
      const isAlreadyFollowing = await this.isFollowing(currentUserId, targetUserId);
      if (isAlreadyFollowing) {
        return { success: false, message: 'Already following this user' };
      }

      // Add to mock follows
      const follows = await this.getMockFollows(currentUserId);
      follows.push(targetUserId);
      await this.saveMockFollows(currentUserId, follows);

      // Update stats
      const stats = await this.getMockStats(currentUserId);
      stats.following += 1;
      await this.saveMockStats(currentUserId, stats);

      console.log(`${currentUserId} successfully followed user: ${targetUserId}. New stats:`, stats);
      
      // Trigger stats update for real-time UI refresh
      this.triggerStatsUpdate(currentUserId);
      
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
      
      // Check if currently following
      const isCurrentlyFollowing = await this.isFollowing(currentUserId, targetUserId);
      if (!isCurrentlyFollowing) {
        return { success: false, message: 'Not following this user' };
      }

      // Remove from mock follows
      const follows = await this.getMockFollows(currentUserId);
      const updatedFollows = follows.filter(id => id !== targetUserId);
      await this.saveMockFollows(currentUserId, updatedFollows);

      // Update stats
      const stats = await this.getMockStats(currentUserId);
      stats.following = Math.max(0, stats.following - 1);
      await this.saveMockStats(currentUserId, stats);

      console.log(`${currentUserId} successfully unfollowed user: ${targetUserId}. New stats:`, stats);
      
      // Trigger stats update for real-time UI refresh
      this.triggerStatsUpdate(currentUserId);
      
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
      // For now, return empty since we need to implement reverse lookup
      // In a real app, this would query the database for users who follow this user
      console.log(`Getting followers for user: ${userId}`);
      return [];
    } catch (error) {
      console.error('Error getting followers list:', error);
      return [];
    }
  }

  // Get detailed following list (with user info)
  async getFollowingList(userId: string): Promise<any[]> {
    try {
      const followingIds = await this.getMockFollows(userId);
      console.log(`Getting following list for user ${userId}:`, followingIds);
      
      // For now, return mock user data
      // In a real app, this would query the database for user details
      const followingUsers = followingIds.map(id => ({
        id,
        name: `User ${id.substring(0, 8)}`,
        username: `user_${id.substring(0, 8)}`,
        avatar: `https://picsum.photos/200/200?random=${id}`,
        bio: 'BlueTrack user'
      }));
      
      return followingUsers;
    } catch (error) {
      console.error('Error getting following list:', error);
      return [];
    }
  }

  // Trigger stats update for real-time UI refresh
  private triggerStatsUpdate(userId: string): void {
    // This would typically emit an event or call a callback
    // For now, we'll use a simple timeout to allow async operations to complete
    setTimeout(() => {
      console.log(`🔔 Triggering stats update for user: ${userId}`);
      // In a full implementation, this would emit events or call React context updates
    }, 100);
  }

  // Search users (with Supabase integration and mock fallback)
  async searchUsers(query: string): Promise<any[]> {
    console.log('🔍 FollowService.searchUsers called with query:', query);
    
    try {
      // Test Supabase connection first
      const connectionTest = await testSupabaseConnection();
      
      if (connectionTest.success) {
        // Search from Supabase profiles
        console.log('📡 Searching users from Supabase...');
        
        let supabaseQuery = supabase
          .from('profiles')
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
          .from('profiles')
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
