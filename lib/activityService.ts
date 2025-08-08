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

  async saveActivity(activity: Omit<Activity, 'id' | 'date'>, userId?: string): Promise<Activity> {
    try {
      const newActivity: Activity = {
        ...activity,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        userId: userId, // Store the userId with the activity
      };

      const existingActivities = await this.getActivities();
      const updatedActivities = [newActivity, ...existingActivities];
      
      await AsyncStorage.setItem(
        ActivityService.STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );

      return newActivity;
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  }

  async getActivities(): Promise<Activity[]> {
    try {
      const activitiesJson = await AsyncStorage.getItem(ActivityService.STORAGE_KEY);
      if (!activitiesJson) return [];
      
      return JSON.parse(activitiesJson) as Activity[];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    try {
      const allActivities = await this.getActivities();
      // Filter activities by userId
      return allActivities.filter(activity => activity.userId === userId);
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getRecentActivities(limit: number = 5, userId?: string): Promise<Activity[]> {
    try {
      if (userId) {
        // Get user-specific activities
        const userActivities = await this.getActivitiesByUser(userId);
        return userActivities
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      } else {
        // Get all activities (fallback for non-authenticated users)
        const activities = await this.getActivities();
        return activities
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  async getActivityById(id: string): Promise<Activity | null> {
    const activities = await this.getActivities();
    return activities.find(activity => activity.id === id) || null;
  }

  async deleteActivity(id: string): Promise<void> {
    try {
      const activities = await this.getActivities();
      const filteredActivities = activities.filter(activity => activity.id !== id);
      
      await AsyncStorage.setItem(
        ActivityService.STORAGE_KEY,
        JSON.stringify(filteredActivities)
      );
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
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
        // Get user-specific stats
        activities = await this.getActivitiesByUser(userId);
      } else {
        // Get all activities (fallback)
        activities = await this.getActivities();
      }
      
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
