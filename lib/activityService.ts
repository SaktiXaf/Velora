import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Activity {
  id: string;
  userId?: string; // Add userId to track which user owns the activity
  type: 'run' | 'bike' | 'walk';
  date: string;
  distance: number; // km
  duration: number; // seconds
  pace: number; // min/km
  calories: number;
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  path: Array<{ latitude: number; longitude: number; timestamp: number }>;
}

class ActivityService {
  private static readonly STORAGE_KEY = 'user_activities';
  
  // Get storage key per user
  private getStorageKey(userId?: string): string {
    if (userId) {
      return `${ActivityService.STORAGE_KEY}_${userId}`;
    }
    return ActivityService.STORAGE_KEY;
  }

  async saveActivity(activity: Omit<Activity, 'id' | 'date'>, userId?: string): Promise<Activity> {
    try {
      const newActivity: Activity = {
        ...activity,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        userId: userId, // Store the userId with the activity
      };

      // Get user-specific activities if userId is provided
      const existingActivities = userId ? 
        await this.getActivitiesByUser(userId) : 
        await this.getActivities();
      const updatedActivities = [newActivity, ...existingActivities];
      
      // Save to user-specific storage key
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedActivities)
      );

      console.log(`💾 Activity saved for user ${userId || 'general'} with key: ${storageKey}`);
      return newActivity;
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  }

  async getActivities(userId?: string): Promise<Activity[]> {
    try {
      let storageKey: string;
      
      if (userId) {
        // Use user-specific storage
        storageKey = this.getStorageKey(userId);
      } else {
        // Use general storage for backward compatibility
        storageKey = ActivityService.STORAGE_KEY;
      }
      
      console.log(`📱 Getting activities with storage key: ${storageKey}`);
      const activitiesJson = await AsyncStorage.getItem(storageKey);
      if (!activitiesJson) {
        console.log(`📱 No activities found with key: ${storageKey}`);
        return [];
      }
      
      const activities = JSON.parse(activitiesJson) as Activity[];
      console.log(`📱 Found ${activities.length} activities with key ${storageKey}`);
      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    try {
      // Get activities from user-specific storage
      const storageKey = this.getStorageKey(userId);
      console.log(`🔍 Getting activities for user ${userId} with storage key: ${storageKey}`);
      
      const activitiesJson = await AsyncStorage.getItem(storageKey);
      
      if (!activitiesJson) {
        console.log(`📱 No activities found for user ${userId} with key: ${storageKey}`);
        return [];
      }
      
      const activities = JSON.parse(activitiesJson) as Activity[];
      console.log(`📱 Found ${activities.length} activities for user ${userId}:`, activities.map(a => ({ id: a.id, type: a.type, date: a.date })));
      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getRecentActivities(limit: number = 5, userId?: string): Promise<Activity[]> {
    try {
      console.log(`🔍 getRecentActivities called with userId: ${userId}, limit: ${limit}`);
      
      if (userId) {
        // Get user-specific activities
        const userActivities = await this.getActivitiesByUser(userId);
        const sorted = userActivities
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
        console.log(`📊 Returning ${sorted.length} recent activities for user ${userId}`);
        return sorted;
      } else {
        // Get all activities (fallback for non-authenticated users)
        const activities = await this.getActivities();
        const sorted = activities
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
        console.log(`📊 Returning ${sorted.length} general recent activities`);
        return sorted;
      }
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  async getActivityById(id: string, userId?: string): Promise<Activity | null> {
    try {
      const activities = await this.getActivities(userId);
      return activities.find(activity => activity.id === id) || null;
    } catch (error) {
      console.error('Error getting activity by id:', error);
      return null;
    }
  }

  async deleteActivity(id: string, userId?: string): Promise<void> {
    try {
      let activities: Activity[];
      let storageKey: string;
      
      if (userId) {
        // Delete from user-specific storage
        activities = await this.getActivitiesByUser(userId);
        storageKey = this.getStorageKey(userId);
      } else {
        // Delete from general storage (fallback)
        activities = await this.getActivities();
        storageKey = this.getStorageKey();
      }
      
      const filteredActivities = activities.filter(activity => activity.id !== id);
      
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(filteredActivities)
      );
      
      console.log(`🗑️ Activity ${id} deleted for user ${userId || 'general'}`);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  // Method to clear all cached data when user changes
  async clearUserCache(userId: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.removeItem(storageKey);
      console.log(`🧹 Cleared activity cache for user: ${userId}`);
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  // Method to get all storage keys for debugging
  async getAllStorageKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith('user_activities'));
    } catch (error) {
      console.error('Error getting storage keys:', error);
      return [];
    }
  }

  async getTotalStats(userId?: string): Promise<{
    totalDistance: number;
    totalDuration: number;
    totalCalories: number;
    totalActivities: number;
  }> {
    try {
      let activities: Activity[];
      
      if (userId) {
        console.log(`📊 Getting stats for user: ${userId}`);
        // Get user-specific stats
        activities = await this.getActivitiesByUser(userId);
        console.log(`📊 Stats calculation for user ${userId}: found ${activities.length} activities`);
      } else {
        console.log(`📊 Getting general stats (no userId)`);
        // Get all activities (fallback)
        activities = await this.getActivities();
        console.log(`📊 General stats calculation: found ${activities.length} activities`);
      }
      
      const stats = {
        totalDistance: activities.reduce((sum, activity) => sum + activity.distance, 0),
        totalDuration: activities.reduce((sum, activity) => sum + activity.duration, 0),
        totalCalories: activities.reduce((sum, activity) => sum + activity.calories, 0),
        totalActivities: activities.length,
      };
      
      console.log(`📊 Final stats for user ${userId || 'general'}:`, stats);
      return stats;
    } catch (error) {
      console.error('Error getting total stats:', error);
      return {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalActivities: 0,
      };
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'run':
        return 'walk';
      case 'bike':
        return 'bicycle';
      case 'walk':
        return 'walk-outline';
      default:
        return 'fitness';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'run':
        return '#FF6B6B';
      case 'bike':
        return '#4ECDC4';
      case 'walk':
        return '#45B7D1';
      default:
        return '#6C5CE7';
    }
  }
}

export const activityService = new ActivityService();
export default ActivityService;
