import { supabase } from './supabase';

// Emergency auth service yang bypass semua masalah
export const EmergencyAuth = {
  // Method untuk register user baru dengan email yang berbeda
  async quickRegister(testEmail: string = 'test@example.com', password: string = '123456') {
    try {
      console.log('EmergencyAuth: Quick registration with new email...');
      
      // 1. Generate unique email for testing
      const timestamp = Date.now();
      const uniqueEmail = testEmail.replace('@', `+${timestamp}@`);
      
      console.log('EmergencyAuth: Using email:', uniqueEmail);
      
      // 2. Sign up with unique email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: password,
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      console.log('EmergencyAuth: User created:', authData.user.id);

      // 3. Insert profile immediately
      const profileData = {
        id: authData.user.id,
        name: 'Test User',
        email: uniqueEmail,
        phone: '08123456789',
        address: 'Test Address',
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.warn('EmergencyAuth: Profile creation failed:', profileError);
        // Continue anyway, profile might not be critical for login
      }

      // 4. Try immediate login (might work if email verification is disabled)
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: uniqueEmail,
          password: password,
        });

        if (!loginError && loginData.user) {
          console.log('EmergencyAuth: Auto-login successful!');
          return { 
            success: true, 
            user: loginData.user, 
            profile,
            credentials: { email: uniqueEmail, password }
          };
        }
      } catch (loginAttemptError) {
        console.log('EmergencyAuth: Auto-login failed, but registration succeeded');
      }

      return { 
        success: true, 
        user: authData.user, 
        profile,
        credentials: { email: uniqueEmail, password },
        message: 'Registration successful. Try login manually.'
      };

    } catch (error) {
      console.error('EmergencyAuth: Registration failed:', error);
      throw error;
    }
  },

  // Method untuk test login dengan credentials yang ada
  async testLogin(email: string, password: string) {
    try {
      console.log('EmergencyAuth: Testing login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw new Error(`Login failed: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      console.log('EmergencyAuth: Login successful!');
      return { success: true, user: data.user };

    } catch (error) {
      console.error('EmergencyAuth: Login failed:', error);
      throw error;
    }
  },

  // Method untuk bypass dengan register + login combo
  async registerAndLogin() {
    try {
      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@gmail.com`;
      const testPassword = '123456';
      
      console.log('EmergencyAuth: Register + Login combo...');
      console.log('EmergencyAuth: Email:', testEmail);
      console.log('EmergencyAuth: Password:', testPassword);

      // Register
      const registerResult = await this.quickRegister(testEmail, testPassword);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try login
      try {
        const loginResult = await this.testLogin(testEmail, testPassword);
        return {
          success: true,
          user: loginResult.user,
          credentials: { email: testEmail, password: testPassword },
          message: 'Registration and login successful!'
        };
      } catch (loginError) {
        return {
          success: true,
          user: registerResult.user,
          credentials: { email: testEmail, password: testPassword },
          message: 'Registration successful. Login might need email verification.',
          loginError: (loginError as Error).message
        };
      }

    } catch (error) {
      console.error('EmergencyAuth: Register + Login failed:', error);
      throw error;
    }
  }
};
