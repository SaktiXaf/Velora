import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class AvatarUploadService {
  private static AVATAR_CACHE_PREFIX = 'avatar_sync_';
  private static LOCAL_AVATAR_PREFIX = 'local_avatar_';

  /**
   * Upload avatar image to Supabase storage with local fallback
   */
  static async uploadAvatar(userId: string, imageUri: string): Promise<ImageUploadResult> {
    try {
      console.log('📸 Starting avatar upload for user:', userId);
      console.log('📸 Image URI:', imageUri);

      // Validate image URI
      if (!imageUri || !imageUri.startsWith('file://')) {
        return {
          success: false,
          error: 'Invalid image URI'
        };
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'Image file does not exist'
        };
      }

      console.log('📸 File info:', { size: fileInfo.size, exists: fileInfo.exists });

      // Try to upload to Supabase storage first
      const supabaseResult = await this.uploadToSupabase(userId, imageUri);
      if (supabaseResult.success) {
        console.log('✅ Avatar uploaded to Supabase successfully');
        // Cache the URL locally for offline access
        await this.cacheAvatarUrl(userId, supabaseResult.url!);
        return supabaseResult;
      }

      console.log('⚠️ Supabase upload failed, using local storage fallback');
      
      // Fallback: Store image locally
      const localResult = await this.storeAvatarLocally(userId, imageUri);
      if (localResult.success) {
        console.log('✅ Avatar stored locally successfully');
        return localResult;
      }

      return {
        success: false,
        error: 'Both Supabase and local storage failed'
      };

    } catch (error) {
      console.error('❌ Error in uploadAvatar:', error);
      
      // Try local storage as final fallback
      try {
        const localResult = await this.storeAvatarLocally(userId, imageUri);
        if (localResult.success) {
          console.log('✅ Avatar stored locally as emergency fallback');
          return localResult;
        }
      } catch (localError) {
        console.error('❌ Local storage fallback also failed:', localError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload to Supabase storage
   */
  private static async uploadToSupabase(userId: string, imageUri: string): Promise<ImageUploadResult> {
    try {
      // Read file as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      
      console.log('📤 Uploading to Supabase storage:', fileName);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`
        });

      if (error) {
        console.error('❌ Supabase storage error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('✅ Supabase upload successful, public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Supabase upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Supabase upload failed'
      };
    }
  }

  /**
   * Store avatar locally for offline use
   */
  private static async storeAvatarLocally(userId: string, imageUri: string): Promise<ImageUploadResult> {
    try {
      // Create local directory for avatars if it doesn't exist
      const avatarDir = `${FileSystem.documentDirectory}avatars/`;
      const dirInfo = await FileSystem.getInfoAsync(avatarDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(avatarDir, { intermediates: true });
      }

      // Copy image to local storage with user ID
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const localFileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
      const localPath = `${avatarDir}${localFileName}`;

      await FileSystem.copyAsync({
        from: imageUri,
        to: localPath
      });

      console.log('💾 Image copied to local storage:', localPath);

      // Save reference in AsyncStorage
      const cacheKey = `${this.LOCAL_AVATAR_PREFIX}${userId}`;
      await AsyncStorage.setItem(cacheKey, localPath);

      return {
        success: true,
        url: localPath
      };

    } catch (error) {
      console.error('❌ Local storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local storage failed'
      };
    }
  }

  /**
   * Cache avatar URL for cross-device sync
   */
  private static async cacheAvatarUrl(userId: string, url: string): Promise<void> {
    try {
      const cacheKey = `${this.AVATAR_CACHE_PREFIX}${userId}`;
      await AsyncStorage.setItem(cacheKey, url);
      console.log('💾 Avatar URL cached for user:', userId);
    } catch (error) {
      console.error('❌ Error caching avatar URL:', error);
    }
  }

  /**
   * Get cached avatar URL
   */
  static async getCachedAvatarUrl(userId: string): Promise<string | null> {
    try {
      // First try Supabase cached URL
      const supabaseCacheKey = `${this.AVATAR_CACHE_PREFIX}${userId}`;
      const supabaseUrl = await AsyncStorage.getItem(supabaseCacheKey);
      
      if (supabaseUrl) {
        console.log('📱 Found cached Supabase avatar URL');
        return supabaseUrl;
      }

      // Then try local storage
      const localCacheKey = `${this.LOCAL_AVATAR_PREFIX}${userId}`;
      const localUrl = await AsyncStorage.getItem(localCacheKey);
      
      if (localUrl) {
        // Verify local file still exists
        const fileInfo = await FileSystem.getInfoAsync(localUrl);
        if (fileInfo.exists) {
          console.log('📱 Found cached local avatar');
          return localUrl;
        } else {
          // Clean up invalid cache entry
          await AsyncStorage.removeItem(localCacheKey);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting cached avatar URL:', error);
      return null;
    }
  }

  /**
   * Delete avatar from storage
   */
  static async deleteAvatar(userId: string, avatarUrl?: string): Promise<boolean> {
    try {
      let success = true;

      // If URL is provided and it's a Supabase URL, delete from Supabase
      if (avatarUrl && avatarUrl.includes('supabase')) {
        try {
          const fileName = avatarUrl.split('/').pop();
          if (fileName) {
            const { error } = await supabase.storage
              .from('avatars')
              .remove([fileName]);
            
            if (error) {
              console.error('❌ Error deleting from Supabase:', error);
              success = false;
            } else {
              console.log('✅ Avatar deleted from Supabase');
            }
          }
        } catch (error) {
          console.error('❌ Supabase delete error:', error);
          success = false;
        }
      }

      // Clean up local cache
      const supabaseCacheKey = `${this.AVATAR_CACHE_PREFIX}${userId}`;
      const localCacheKey = `${this.LOCAL_AVATAR_PREFIX}${userId}`;
      
      await AsyncStorage.removeItem(supabaseCacheKey);
      
      const localPath = await AsyncStorage.getItem(localCacheKey);
      if (localPath) {
        try {
          await FileSystem.deleteAsync(localPath);
          await AsyncStorage.removeItem(localCacheKey);
          console.log('✅ Local avatar deleted');
        } catch (error) {
          console.error('❌ Error deleting local avatar:', error);
          success = false;
        }
      }

      return success;
    } catch (error) {
      console.error('❌ Error in deleteAvatar:', error);
      return false;
    }
  }

  /**
   * Clear all cached avatars (for logout)
   */
  static async clearAllAvatarCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter(key => 
        key.startsWith(this.AVATAR_CACHE_PREFIX) || 
        key.startsWith(this.LOCAL_AVATAR_PREFIX)
      );
      
      await AsyncStorage.multiRemove(avatarKeys);
      console.log('🧹 Avatar cache cleared');
    } catch (error) {
      console.error('❌ Error clearing avatar cache:', error);
    }
  }
}
