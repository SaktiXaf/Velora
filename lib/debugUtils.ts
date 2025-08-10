import AsyncStorage from '@react-native-async-storage/async-storage';

export class DebugUtils {
  static async logAllStorageData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const activityKeys = keys.filter(key => key.startsWith('user_activities'));
      
      console.log('🔧 DEBUG: All activity storage keys:', activityKeys);
      
      for (const key of activityKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const activities = JSON.parse(data);
          console.log(`🔧 DEBUG: Data for ${key}:`, activities.map((a: any) => ({
            id: a.id,
            type: a.type,
            userId: a.userId,
            date: a.date.substring(0, 10) // Show only date part
          })));
        }
      }
      
      // Also check session storage
      const sessionData = await AsyncStorage.getItem('user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        console.log('🔧 DEBUG: Current session:', session);
      }
    } catch (error) {
      console.error('🔧 DEBUG: Error logging storage data:', error);
    }
  }
  
  static async clearAllActivityData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const activityKeys = keys.filter(key => key.startsWith('user_activities'));
      
      for (const key of activityKeys) {
        await AsyncStorage.removeItem(key);
        console.log(`🧹 DEBUG: Cleared ${key}`);
      }
      
      console.log(`🧹 DEBUG: Cleared ${activityKeys.length} activity storage keys`);
    } catch (error) {
      console.error('🧹 DEBUG: Error clearing activity data:', error);
    }
  }

  // Force clean start for user - use this if data gets corrupted
  static async forceCleanUserData(userId: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => key.includes(userId));
      
      for (const key of userKeys) {
        await AsyncStorage.removeItem(key);
        console.log(`🔥 FORCE CLEAN: Removed ${key}`);
      }
      
      console.log(`🔥 FORCE CLEAN: Removed ${userKeys.length} keys for user ${userId}`);
    } catch (error) {
      console.error('🔥 FORCE CLEAN: Error:', error);
    }
  }
}
