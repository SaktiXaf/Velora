import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  LAST_LOGIN: 'last_login',
} as const;

export interface StoredSession {
  userId: string;
  email: string;
  lastLogin: string;
}

export const sessionStorage = {
  async saveSession(user: { id: string; email?: string }): Promise<void> {
    try {
      const sessionData: StoredSession = {
        userId: user.id,
        email: user.email || '',
        lastLogin: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      console.log('💾 Session saved locally');
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  },

  async getStoredSession(): Promise<StoredSession | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (!sessionJson) return null;
      
      const session = JSON.parse(sessionJson) as StoredSession;
      console.log('📱 Local session found for:', session.email);
      return session;
    } catch (error) {
      console.error('❌ Error getting stored session:', error);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      console.log('🗑️  Local session cleared');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  },

  // Clear all user-related data (for complete logout)
  async clearAllUserData(): Promise<void> {
    try {
      // Get all keys to find user-specific data
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find keys that contain user data
      const userDataKeys = allKeys.filter(key => 
        key.includes('profile_cache_') ||
        key.includes('avatar_cache_') ||
        key.includes('user_activities_') ||
        key.includes('notifications_') ||
        key === STORAGE_KEYS.USER_SESSION
      );
      
      // Remove all user-related data
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log('🗑️  Cleared all user data:', userDataKeys.length, 'items');
      }
    } catch (error) {
      console.error('❌ Error clearing all user data:', error);
    }
  },

  async isSessionValid(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const session = await this.getStoredSession();
      if (!session) return false;
      
      const lastLogin = new Date(session.lastLogin);
      const now = new Date();
      const age = now.getTime() - lastLogin.getTime();
      
      return age < maxAge; // 30 days by default
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return false;
    }
  }
};
