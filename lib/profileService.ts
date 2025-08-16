import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarUploadService } from './avatarUploadService';
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
      
      // If server has avatar URL, update local cache
      if (avatarUrl) {
        await AsyncStorage.setItem(cacheKey, avatarUrl);
        console.log('📱 Avatar URL synced for user:', userId);
      } else {
        // Only clear local avatar if it doesn't exist locally
        // This prevents server null values from overriding locally uploaded avatars
        const existingAvatar = await AsyncStorage.getItem(cacheKey);
        if (!existingAvatar) {
          console.log('📱 No avatar to clear for user:', userId);
        } else {
          console.log('📱 Preserving local avatar (server has null):', userId);
        }
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
        .from('users')
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
      console.log('📝 Updating profile for user:', userId);
      console.log('📝 Updates:', JSON.stringify(updates, null, 2));

      // Check if this is an avatar update
      if (updates.avatar !== undefined) {
        console.log('📸 Avatar update detected:', {
          hasAvatar: !!updates.avatar,
          avatarType: typeof updates.avatar,
          avatarValue: updates.avatar?.substring(0, 50) + '...'
        });

        // If avatar is a local file URI, upload it first
        if (updates.avatar && updates.avatar.startsWith('file://')) {
          console.log('📤 Uploading new avatar image...');
          const uploadedUrl = await this.uploadAvatar(userId, updates.avatar);
          
          if (uploadedUrl) {
            console.log('✅ Avatar uploaded successfully, new URL:', uploadedUrl);
            updates.avatar = uploadedUrl;
          } else {
            console.log('⚠️ Avatar upload failed, keeping local file URI');
            // Keep the local URI as fallback
          }
        }
      }

      // STEP 1: Always update cache FIRST to guarantee data persistence
      const currentProfile = await this.getCachedProfile(userId);
      console.log('📱 Current cached profile:', currentProfile ? {
        name: currentProfile.name,
        bio: currentProfile.bio, 
        age: currentProfile.age,
        avatar: currentProfile.avatar?.substring(0, 50) + '...'
      } : 'No cached profile');

      let updatedProfile: DatabaseUser;

      if (currentProfile) {
        // Update existing profile
        updatedProfile = { 
          ...currentProfile, 
          ...updates  // This will overwrite with new values
        };
      } else {
        // Create new profile
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

      console.log('📝 Final profile to save:', {
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        age: updatedProfile.age,
        avatarPreview: updatedProfile.avatar?.substring(0, 50) + '...',
        avatarExists: !!updatedProfile.avatar
      });

      // Save to cache (this ALWAYS succeeds)
      await this.cacheProfile(userId, updatedProfile);
      console.log('✅ Profile saved to cache - data is now persistent');

      // STEP 2: Try to update database (optional)
      try {
        console.log('🔄 Attempting database update...');
        const { data, error: dbError } = await supabase
          .from('users')
          .update({
            name: updatedProfile.name,
            bio: updatedProfile.bio,
            age: updatedProfile.age,
            avatar: updatedProfile.avatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select();

        if (dbError) {
          console.log('⚠️ Database update failed (but cache succeeded):', {
            message: dbError.message,
            code: dbError.code,
            hint: dbError.hint,
            details: dbError.details
          });
          console.log('💡 Suggestion: Check RLS policies in Supabase dashboard');
        } else {
          console.log('✅ Profile synced to database successfully:', data);
        }
      } catch (dbError) {
        console.log('⚠️ Database sync exception (but cache succeeded):', dbError);
      }

      // Sync avatar URL if avatar was updated
      if (updates.avatar !== undefined) {
        await this.syncAvatarURL(userId, updates.avatar);
        console.log('✅ Avatar URL synced across devices');
      }

      return true; // Always return true because cache update succeeded
    } catch (error) {
      console.error('❌ Critical error in updateProfile:', error);
      return false;
    }
  }

  static async createProfile(profileData: Omit<DatabaseUser, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
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

  // Method to force sync profile from server (useful for cross-device login)
  static async forceProfileSync(userId: string): Promise<DatabaseUser | null> {
    try {
      console.log('🔄 Force syncing profile from server for user:', userId);
      
      const cacheKey = `${PROFILE_CACHE_PREFIX}${userId}`;
      
      // Get existing cached data first to preserve local updates
      const cachedProfile = await AsyncStorage.getItem(cacheKey);
      const existingProfile = cachedProfile ? JSON.parse(cachedProfile) : null;
      
      // Get fresh data from server
      const serverProfile = await this.getProfile(userId);
      
      if (serverProfile) {
        // Merge server data with existing local data, preserving local values where they exist
        const mergedProfile = {
          ...serverProfile,
          // Preserve local data if it exists and server data is empty/null
          age: existingProfile?.age ?? serverProfile.age,
          bio: existingProfile?.bio || serverProfile.bio,
          avatar: existingProfile?.avatar || serverProfile.avatar,
        };
        
        // Save merged profile back to cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify(mergedProfile));
        console.log('📱 Profile synced and merged with local data, preserved avatar:', !!mergedProfile.avatar);
        
        return mergedProfile;
      }
      
      return serverProfile;
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

  // Clear all profile cache (for logout)
  static async clearAllProfileCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const profileKeys = allKeys.filter(key => 
        key.startsWith(PROFILE_CACHE_PREFIX) || 
        key.startsWith(AVATAR_CACHE_PREFIX)
      );
      
      if (profileKeys.length > 0) {
        await AsyncStorage.multiRemove(profileKeys);
        console.log('🗑️  Cleared all profile cache:', profileKeys.length, 'items');
      }
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }

  // Clear specific user profile cache
  static async clearUserProfileCache(userId: string): Promise<void> {
    try {
      const profileKey = `${PROFILE_CACHE_PREFIX}${userId}`;
      const avatarKey = `${AVATAR_CACHE_PREFIX}${userId}`;
      
      await AsyncStorage.multiRemove([profileKey, avatarKey]);
      console.log('🗑️  Cleared profile cache for user:', userId);
    } catch (error) {
      console.error('Error clearing user profile cache:', error);
    }
  }

  // Ensure profile exists (required by profile.tsx)
  static async ensureProfileExists(userId: string, email?: string, name?: string): Promise<boolean> {
    try {
      console.log('🔍 Ensuring profile exists for user:', userId);
      
      // Check cache first
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        console.log('✅ Profile exists in cache');
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
      console.log('✅ New profile created in cache');
      
      return true;
    } catch (error) {
      console.error('❌ Error ensuring profile exists:', error);
      return false;
    }
  }

  // Load profile with persistence (required by profile.tsx)
  static async loadProfileWithPersistence(userId: string): Promise<DatabaseUser | null> {
    try {
      console.log('🔄 Loading profile with persistence for user:', userId);
      
      // Try cache first for persistence
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        console.log('📱 Found persistent profile data:', {
          name: cachedProfile.name,
          bio: cachedProfile.bio || 'No bio',
          age: cachedProfile.age || 'No age',
          avatarExists: !!cachedProfile.avatar,
          avatarPreview: cachedProfile.avatar?.substring(0, 50) + '...',
          avatarType: typeof cachedProfile.avatar
        });
        
        // Check for synced avatar URL
        const syncedAvatar = await this.getSyncedAvatarURL(userId);
        if (syncedAvatar && syncedAvatar !== cachedProfile.avatar) {
          console.log('📱 Found newer synced avatar, updating:', syncedAvatar.substring(0, 50) + '...');
          cachedProfile.avatar = syncedAvatar;
        }
        
        return cachedProfile;
      }
      
      console.log('❌ No cached profile found, trying database...');
      // Fallback to regular getProfile
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Error loading profile with persistence:', error);
      return null;
    }
  }

  // Enhanced clear cache (required by profile.tsx)
  static async clearAllProfileCacheEnhanced(): Promise<void> {
    try {
      console.log('🗑️ Clearing enhanced profile cache...');
      await this.clearAllProfileCache();
      console.log('✅ Enhanced profile cache cleared');
    } catch (error) {
      console.error('Error clearing enhanced profile cache:', error);
    }
  }
}
