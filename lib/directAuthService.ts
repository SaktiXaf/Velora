import { supabase } from './supabase';

class DirectAuthService {
  // Langsung login tanpa password - EMERGENCY ONLY
  async emergencyLogin(email?: string) {
    try {
      const finalEmail = email || `emergency${Date.now()}@gmail.com`;
      
      console.log('DirectAuth: Emergency login for:', finalEmail);

      // Try to get or create user directly
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', finalEmail)
        .single();

      let userId = existingUser?.id;

      if (!existingUser) {
        // Create user directly in profiles table
        userId = crypto.randomUUID();
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: finalEmail,
            name: `Emergency User ${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('DirectAuth: Failed to create emergency user:', createError);
          throw createError;
        }
        
        console.log('DirectAuth: Emergency user created:', userId);
      }

      // Return mock session data
      const mockUser = {
        id: userId,
        email: finalEmail,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated'
      };

      return {
        success: true,
        user: mockUser,
        profile: existingUser || {
          id: userId,
          email: finalEmail,
          name: `Emergency User ${Date.now()}`
        },
        message: `EMERGENCY LOGIN BERHASIL!\n\nEmail: ${finalEmail}\n\nAnda masuk dalam mode emergency.`
      };

    } catch (error) {
      console.error('DirectAuth: Emergency login failed:', error);
      throw error;
    }
  }

  // Backup registration method
  async backupRegister(email?: string, name?: string) {
    try {
      const finalEmail = email || `backup${Date.now()}@gmail.com`;
      const finalName = name || `Backup User ${Date.now()}`;
      const userId = crypto.randomUUID();

      console.log('DirectAuth: Backup registration for:', { email: finalEmail, name: finalName });

      // Direct insert to profiles table
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: finalEmail,
            name: finalName,
            created_at: new Date().toISOString()
          })
          .select()
          .single();      if (error) {
        console.error('DirectAuth: Backup registration failed:', error);
        throw error;
      }

      console.log('DirectAuth: Backup registration successful:', data);

      return {
        success: true,
        user: {
          id: userId,
          email: finalEmail,
          created_at: new Date().toISOString()
        },
        profile: data,
        credentials: {
          email: finalEmail,
          name: finalName,
          userId: userId
        },
        message: `BACKUP REGISTRATION BERHASIL!\n\nEmail: ${finalEmail}\nNama: ${finalName}\n\nUser ID: ${userId}`
      };

    } catch (error) {
      console.error('DirectAuth: Backup registration failed:', error);
      throw error;
    }
  }

  // Complete emergency flow
  async emergencyFlow() {
    try {
      console.log('DirectAuth: Starting emergency flow...');
      
      const registerResult = await this.backupRegister();
      
      if (registerResult.success) {
        const loginResult = await this.emergencyLogin(registerResult.credentials.email);
        
        return {
          success: true,
          user: loginResult.user,
          profile: loginResult.profile,
          credentials: registerResult.credentials,
          message: `🚨 EMERGENCY SUCCESS! 🚨\n\nRegistrasi dan login emergency berhasil!\n\nEmail: ${registerResult.credentials.email}\nNama: ${registerResult.credentials.name}\n\nAnda sekarang bisa menggunakan app!`
        };
      }

      throw new Error('Emergency flow failed');
    } catch (error) {
      console.error('DirectAuth: Emergency flow failed:', error);
      throw error;
    }
  }
}

export const directAuth = new DirectAuthService();
