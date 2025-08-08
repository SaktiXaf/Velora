import { DatabaseUser, supabase } from './supabase';

export { DatabaseUser };

export class ProfileService {
  static async getProfile(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
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

      return data.id;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  }

  static async uploadAvatar(userId: string, file: any): Promise<string | null> {
    try {
      const fileName = `${userId}_${Date.now()}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        
        if (error.message.includes('Bucket not found')) {
          console.log('Avatars bucket not found, this is expected for now');
          return null;
        }
        
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  }
}
