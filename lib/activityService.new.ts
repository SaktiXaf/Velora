import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

// Database row type that matches Supabase table
interface ActivityRow {
  id: string;
  user_id: string;
  type: 'run' | 'bike' | 'walk';
  date: string;
  distance: number;
  duration: number;
  pace: number;
  calories: number;
  avg_speed: number;
  max_speed: number;
  path: any;
  created_at: string;
  updated_at: string;
}

class ActivityService {
  private static readonly STORAGE_KEY = 'user_activities';
  
  // Convert database row to Activity interface
  private dbRowToActivity(row: ActivityRow): Activity {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      date: row.date,
      distance: row.distance,
      duration: row.duration,
      pace: row.pace,
      calories: row.calories,
      avgSpeed: row.avg_speed,
      maxSpeed: row.max_speed,
      path: row.path || []
    };
  }

  // Convert Activity to database row format
  private activityToDbRow(activity: Omit<Activity, 'id'>, userId: string): Omit<ActivityRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: userId,
      type: activity.type,
      date: activity.date,
      distance: activity.distance,
      duration: activity.duration,
      pace: activity.pace,
      calories: activity.calories,
      avg_speed: activity.avgSpeed,
      max_speed: activity.maxSpeed,
      path: activity.path
    };
  }
  
  // Get storage key per user (for local backup/fallback)
  private getStorageKey(userId?: string): string {
    if (userId) {
      return `${ActivityService.STORAGE_KEY}_${userId}`;
    }
    return ActivityService.STORAGE_KEY;
  }

  // Get activities from local storage
  private async getActivitiesFromLocal(userId: string): Promise<Activity[]> {
    try {
      const storageKey = this.getStorageKey(userId);
      const activitiesJson = await AsyncStorage.getItem(storageKey);
      if (!activitiesJson) {
        return [];
      }
      return JSON.parse(activitiesJson) as Activity[];
    } catch (error) {
      console.error('Error getting local activities:', error);
      return [];
    }
  }

  // Update local storage with latest activities from database
  private async updateLocalBackup(activities: Activity[], userId: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(activities));
    } catch (error) {
      console.error('⚠️ Failed to update local backup:', error);
    }
  }

  // Save to local storage as backup
  private async saveActivityToLocalBackup(activity: Activity, userId: string): Promise<void> {
    try {
      const existingActivities = await this.getActivitiesFromLocal(userId);
      const updatedActivities = [activity, ...existingActivities.filter(a => a.id !== activity.id)];
      
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('⚠️ Failed to save local backup:', error);
    }
  }

  // Fallback method to save locally
  private async saveActivityLocally(activity: Omit<Activity, 'id'>, userId: string): Promise<Activity> {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
    };

    const existingActivities = await this.getActivitiesFromLocal(userId);
    const updatedActivities = [newActivity, ...existingActivities];
    
    const storageKey = this.getStorageKey(userId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedActivities));
    
    console.log(`💾 Activity saved locally for user ${userId}`);
    return newActivity;
  }

  async saveActivity(activity: Omit<Activity, 'id' | 'date'>, userId?: string): Promise<Activity> {
    try {
      if (!userId) {
        throw new Error('User ID is required to save activity');
      }

      const newActivity: Omit<Activity, 'id'> = {
        ...activity,
        date: new Date().toISOString(),
        userId: userId,
      };

      console.log(`💾 Saving activity to database for user ${userId}`);
      
      // Save to Supabase database
      const dbRow = this.activityToDbRow(newActivity, userId);
      const { data, error } = await supabase
        .from('activities')
        .insert([dbRow])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving activity to database:', error);
        // Fallback to local storage
        return this.saveActivityLocally(newActivity, userId);
      }

      const savedActivity = this.dbRowToActivity(data);
      console.log(`✅ Activity saved to database successfully`);
      
      // Also save to local storage as backup
      await this.saveActivityToLocalBackup(savedActivity, userId);
      
      return savedActivity;
    } catch (error) {
      console.error('❌ Error saving activity:', error);
      // Fallback to local storage
      if (userId) {
        return this.saveActivityLocally({ ...activity, date: new Date().toISOString(), userId }, userId);
      }
      throw error;
    }
  }

  async getActivities(userId?: string): Promise<Activity[]> {
    try {
      if (!userId) {
        console.log('⚠️ No userId provided, returning empty activities');
        return [];
      }

      console.log(`🔍 Getting activities for user ${userId} from database`);
      
      // Try to fetch from Supabase database first
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching activities from database:', error);
        // Fallback to local storage
        console.log('📱 Falling back to local storage');
        return this.getActivitiesFromLocal(userId);
      }

      if (!data || data.length === 0) {
        console.log(`📱 No activities found in database for user ${userId}`);
        // Check local storage as fallback
        const localActivities = await this.getActivitiesFromLocal(userId);
        if (localActivities.length > 0) {
          console.log(`📱 Found ${localActivities.length} activities in local storage`);
        }
        return localActivities;
      }

      // Convert database rows to Activity objects
      const activities = data.map(row => this.dbRowToActivity(row));
      console.log(`✅ Fetched ${activities.length} activities from database`);
      
      // Update local backup
      await this.updateLocalBackup(activities, userId);
      
      return activities;
    } catch (error) {
      console.error('❌ Error getting activities:', error);
      // Fallback to local storage
      if (userId) {
        return this.getActivitiesFromLocal(userId);
      }
      return [];
    }
  }

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    return this.getActivities(userId);
  }

  async getRecentActivities(limit: number = 5, userId?: string): Promise<Activity[]> {
    try {
      console.log(`🔍 getRecentActivities called with userId: ${userId}, limit: ${limit}`);
      
      if (!userId) {
        console.log('⚠️ No userId provided for getRecentActivities');
        return [];
      }

      const activities = await this.getActivities(userId);
      const sorted = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      console.log(`📊 Returning ${sorted.length} recent activities for user ${userId}`);
      return sorted;
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
      if (!userId) {
        throw new Error('User ID is required to delete activity');
      }

      console.log(`🗑️ Deleting activity ${id} for user ${userId}`);
      
      // Delete from database
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting activity from database:', error);
        // Fallback to local deletion
        await this.deleteActivityLocally(id, userId);
        return;
      }

      console.log(`✅ Activity ${id} deleted from database`);
      
      // Also remove from local backup
      await this.deleteActivityLocally(id, userId);
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      if (userId) {
        await this.deleteActivityLocally(id, userId);
      }
    }
  }

  private async deleteActivityLocally(id: string, userId: string): Promise<void> {
    try {
      const activities = await this.getActivitiesFromLocal(userId);
      const filteredActivities = activities.filter(activity => activity.id !== id);
      
      const storageKey = this.getStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(filteredActivities));
      console.log(`💾 Activity ${id} deleted locally`);
    } catch (error) {
      console.error('Error deleting activity locally:', error);
    }
  }

  async getTotalStats(userId?: string): Promise<{
    totalDistance: number;
    totalDuration: number;
    totalCalories: number;
    totalActivities: number;
  }> {
    try {
      const activities = await this.getActivities(userId);
      
      return {
        totalDistance: activities.reduce((sum, activity) => sum + activity.distance, 0),
        totalDuration: activities.reduce((sum, activity) => sum + activity.duration, 0),
        totalCalories: activities.reduce((sum, activity) => sum + activity.calories, 0),
        totalActivities: activities.length,
      };
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
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'run':
        return 'person-outline';
      case 'bike':
        return 'bicycle-outline';
      case 'walk':
        return 'walk-outline';
      default:
        return 'fitness-outline';
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
        return '#96CEB4';
    }
  }
}

export const activityService = new ActivityService();
