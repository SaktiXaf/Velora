import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarUploadService } from './avatarUploadService';
import { DatabaseUser, supabase } from './supabase';
import { UserService, UserProfile } from './userService';

export { DatabaseUser };

const PROFILE_CACHE_PREFIX = 'profile_cache_';

export class ProfileService {
  
  // Simple cache profile data
  private static async cacheProfile(userId: string, profile: DatabaseUser): Promise<void> {
    try {
      const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(profile));
      console.log('📱 Profile cached for user:', userId);
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  // Get cached profile data
  private static async getCachedProfile(userId: string): Promise<DatabaseUser | null> {
    try {
      const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const profile = JSON.parse(cached) as DatabaseUser;
        console.log('📱 Found cached profile for user:', userId);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  static async getProfile(userId: string): Promise<DatabaseUser | null> {
    try {
      console.log('📱 Getting profile for user:', userId);
      
      // First try cache for instant response
      const cachedProfile = await this.getCachedProfile(userId);
      
      // Try to get from database
      const result = await UserService.getUserProfile(userId);
      
      if (result.success && result.user) {
        // Convert UserProfile to DatabaseUser format
        const data: DatabaseUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || result.user.email || '',
          age: result.user.age || undefined,
          bio: result.user.bio || undefined,
          avatar: result.user.profile_picture || undefined,
          created_at: result.user.created_at || new Date().toISOString(),
        };

        // Cache the new data
        await this.cacheProfile(userId, data);
        console.log('📱 Profile loaded from database');
        return data;
      } else {
        // Return cached if database fails
        if (cachedProfile) {
          console.log('📱 Using cached profile (database failed)');
          return cachedProfile;
        }
        
        console.error('❌ Error fetching profile:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      
      // Final fallback to cached data
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        console.log('📱 Using cached profile (exception fallback)');
        return cachedProfile;
      }
      
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      console.log('📝 Updating profile for user:', userId);

      // Handle avatar upload if needed
      if (updates.avatar && updates.avatar.startsWith('file://')) {
        console.log('📤 Uploading new avatar image...');
        const uploadedUrl = await this.uploadAvatar(userId, updates.avatar);
        if (uploadedUrl) {
          updates.avatar = uploadedUrl;
        }
      }

      // Get current profile
      const currentProfile = await this.getCachedProfile(userId);
      
      // Create updated profile
      let updatedProfile: DatabaseUser;
      if (currentProfile) {
        updatedProfile = { ...currentProfile, ...updates };
      } else {
        updatedProfile = {
          id: userId,
          email: `user_${userId.substring(0, 8)}@temp.com`,
          name: updates.name || 'User',
          bio: updates.bio || '',
          age: updates.age,
          avatar: updates.avatar,
          created_at: new Date().toISOString()
        };
      }

      // Always cache first (guaranteed to work)
      await this.cacheProfile(userId, updatedProfile);
      
      // Try to update database (optional)
      try {
        const { error: dbError } = await supabase
          .from('users')
          .update({
            name: updatedProfile.name,
            bio: updatedProfile.bio,
            age: updatedProfile.age,
            avatar: updatedProfile.avatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (dbError) {
          console.log('⚠️ Database update failed (but cache succeeded):', dbError.message);
        } else {
          console.log('✅ Profile synced to database');
        }
      } catch (dbError) {
        console.log('⚠️ Database sync exception (but cache succeeded):', dbError);
      }

      return true;
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      return false;
    }
  }

  static async uploadAvatar(userId: string, imageUri: string): Promise<string | null> {
    try {
      console.log('📸 Starting avatar upload for user:', userId);
      
      const result = await AvatarUploadService.uploadAvatar(userId, imageUri);
      
      if (result.success && result.url) {
        console.log('✅ Avatar upload successful');
        return result.url;
      } else {
        console.error('❌ Avatar upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error in uploadAvatar:', error);
      return null;
    }
  }

  // Simple ensure profile exists
  static async ensureProfileExists(userId: string, email?: string, name?: string): Promise<boolean> {
    try {
      console.log('🔍 Ensuring profile exists for user:', userId);
      
      // Check if profile already exists
      const existingProfile = await this.getProfile(userId);
      if (existingProfile) {
        console.log('✅ Profile already exists');
        return true;
      }
      
      // Create new profile
      const newProfile: DatabaseUser = {
        id: userId,
        email: email || `user_${userId.substring(0, 8)}@temp.com`,
        name: name || email?.split('@')[0] || 'User',
        bio: '',
        created_at: new Date().toISOString()
      };
      
      await this.cacheProfile(userId, newProfile);
      console.log('✅ New profile created');
      
      return true;
    } catch (error) {
      console.error('❌ Error ensuring profile exists:', error);
      return false;
    }
  }

  // Simple load with persistence - just use getProfile
  static async loadProfileWithPersistence(userId: string): Promise<DatabaseUser | null> {
    console.log('🔄 Loading profile with persistence for user:', userId);
    return await this.getProfile(userId);
  }

  // Clear all profile cache
  static async clearAllProfileCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const profileKeys = allKeys.filter(key => key.startsWith(PROFILE_CACHE_PREFIX));
      
      if (profileKeys.length > 0) {
        await AsyncStorage.multiRemove(profileKeys);
        console.log('🗑️ Cleared all profile cache:', profileKeys.length, 'items');
      }
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }

  // Enhanced clear cache alias
  static async clearAllProfileCacheEnhanced(): Promise<void> {
    await this.clearAllProfileCache();
  }
}
