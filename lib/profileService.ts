import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseUser, supabase } from './supabase';

export { DatabaseUser };

const PROFILE_CACHE_PREFIX = 'profile_cache_';
const AVATAR_CACHE_PREFIX = 'avatar_cache_';

export class ProfileService {
  
  // Cache profile data locally for cross-device sync
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
        console.log('📱 Found cached profile for user:', userId, 'with avatar:', !!profile.avatar);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  // Sync avatar URL locally for cross-device consistency
  private static async syncAvatarURL(userId: string, avatarUrl: string | null): Promise<void> {
    try {
      const cacheKey = `${AVATAR_CACHE_PREFIX}${userId}`;
      if (avatarUrl) {
        await AsyncStorage.setItem(cacheKey, avatarUrl);
        console.log('📱 Avatar URL synced for user:', userId);
      } else {
        await AsyncStorage.removeItem(cacheKey);
        console.log('📱 Avatar URL cleared for user:', userId);
      }
    } catch (error) {
      console.error('Error syncing avatar URL:', error);
    }
  }

  // Get synced avatar URL
  private static async getSyncedAvatarURL(userId: string): Promise<string | null> {
    try {
      const cacheKey = `${AVATAR_CACHE_PREFIX}${userId}`;
      const avatarUrl = await AsyncStorage.getItem(cacheKey);
      if (avatarUrl) {
        console.log('📱 Found synced avatar URL for user:', userId);
        return avatarUrl;
      }
      return null;
    } catch (error) {
      console.error('Error getting synced avatar URL:', error);
      return null;
    }
  }

  static async getProfile(userId: string): Promise<DatabaseUser | null> {
    try {
      console.log('📱 Getting profile for user:', userId);
      
      // First try to get from server
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile from server:', error);
        
        if (error.message.includes('Network request failed')) {
          console.log('🌐 Network error, using cached profile');
        }
        
        // Fallback to cached profile if server fails
        const cachedProfile = await this.getCachedProfile(userId);
        if (cachedProfile) {
          console.log('📱 Using cached profile as fallback');
          // Also check for synced avatar
          const syncedAvatar = await this.getSyncedAvatarURL(userId);
          if (syncedAvatar && syncedAvatar !== cachedProfile.avatar) {
            cachedProfile.avatar = syncedAvatar;
            console.log('📱 Updated cached profile with synced avatar');
          }
          return cachedProfile;
        }
        return null;
      }

      // If server data exists, cache it and sync avatar
      if (data) {
        await this.cacheProfile(userId, data);
        await this.syncAvatarURL(userId, data.avatar);
        console.log('📱 Profile synced from server, avatar:', !!data.avatar);
        return data;
      }

      // If no server data, check for cached profile with synced avatar
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        const syncedAvatar = await this.getSyncedAvatarURL(userId);
        if (syncedAvatar && syncedAvatar !== cachedProfile.avatar) {
          cachedProfile.avatar = syncedAvatar;
          console.log('📱 Updated cached profile with synced avatar');
        }
        return cachedProfile;
      }

      return null;
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('🌐 Network request failed, using cached profile');
      }
      
      // Final fallback to cached data
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        const syncedAvatar = await this.getSyncedAvatarURL(userId);
        if (syncedAvatar && syncedAvatar !== cachedProfile.avatar) {
          cachedProfile.avatar = syncedAvatar;
        }
      }
      return cachedProfile;
    }
  }

  static async updateProfile(userId: string, updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      // Update local cache with new data
      const currentProfile = await this.getCachedProfile(userId);
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...updates };
        await this.cacheProfile(userId, updatedProfile);
      }

      // Sync avatar URL if avatar was updated
      if (updates.avatar !== undefined) {
        await this.syncAvatarURL(userId, updates.avatar);
        console.log('📱 Avatar updated and synced across devices');
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  static async createProfile(profileData: Omit<DatabaseUser, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select('id')
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      // Cache the new profile and sync avatar
      const newProfile = { ...profileData, id: data.id, created_at: new Date().toISOString() } as DatabaseUser;
      await this.cacheProfile(data.id, newProfile);
      if (profileData.avatar) {
        await this.syncAvatarURL(data.id, profileData.avatar);
        console.log('📱 New profile created and avatar synced');
      }

      return data.id;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  }

  static async uploadAvatar(userId: string, file: any): Promise<string | null> {
    try {
      console.log('📸 Starting avatar upload for user:', userId);
      
      // First try Supabase storage
      const fileName = `${userId}_${Date.now()}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Supabase storage error:', error);
        
        if (error.message.includes('Bucket not found')) {
          console.log('💾 Avatars bucket not found, using local storage fallback');
        } else if (error.message.includes('Network request failed')) {
          console.log('🌐 Network error, using local storage fallback');
        } else {
          console.log('🔄 Upload failed, using local storage fallback');
        }
        
        // Fallback: Store avatar locally and return local URI
        if (file && typeof file === 'string') {
          console.log('💾 Storing avatar locally for cross-device sync');
          await this.syncAvatarURL(userId, file);
          return file;
        }
        
        return null;
      }

      // If successful, get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('✅ Avatar uploaded successfully to Supabase');
      
      // Also sync locally for cross-device consistency
      await this.syncAvatarURL(userId, urlData.publicUrl);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadAvatar:', error);
      
      // Network error fallback - store locally
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('🌐 Network request failed, storing avatar locally');
        if (file && typeof file === 'string') {
          await this.syncAvatarURL(userId, file);
          return file;
        }
      }
      
      return null;
    }
  }

  // Method to force sync profile from server (useful for cross-device login)
  static async forceProfileSync(userId: string): Promise<DatabaseUser | null> {
    try {
      console.log('🔄 Force syncing profile from server for user:', userId);
      
      // Clear local cache first
      const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;
      await AsyncStorage.removeItem(cacheKey);
      
      // Get fresh data from server
      const profile = await this.getProfile(userId);
      
      if (profile && profile.avatar) {
        console.log('📱 Profile synced with avatar from server');
      }
      
      return profile;
    } catch (error) {
      console.error('Error in forceProfileSync:', error);
      return null;
    }
  }

  // Method to get avatar URL for cross-device consistency
  static async getAvatarURL(userId: string): Promise<string | null> {
    try {
      // First check synced avatar URL
      const syncedUrl = await this.getSyncedAvatarURL(userId);
      if (syncedUrl) {
        return syncedUrl;
      }

      // Fallback to profile data
      const profile = await this.getProfile(userId);
      return profile?.avatar || null;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }
}
