import { supabase } from './supabase';

// Simple service untuk quick testing tanpa email confirmation
export const SimpleAuthService = {
  async testRegister(email: string, password: string, name: string) {
    try {
      console.log('SimpleAuth: Quick registration test...');
      
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('SimpleAuth: User created, attempting immediate profile insert...');
      
      // 2. Force profile insert (assuming RLS is disabled)
      const profileData = {
        id: authData.user.id,
        name: name,
        email: email,
        phone: '08123456789',
        address: 'Test Address',
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('SimpleAuth: Profile error:', profileError);
        throw new Error('Profile creation failed: ' + profileError.message);
      }

      console.log('SimpleAuth: Profile created successfully');

      // 3. Manual email confirmation via SQL (if possible)
      try {
        await supabase.rpc('confirm_user_email', { user_email: email });
      } catch (confirmError) {
        console.log('SimpleAuth: Could not auto-confirm email:', confirmError);
      }

      return { user: authData.user, profile };

    } catch (error) {
      console.error('SimpleAuth: Registration failed:', error);
      throw error;
    }
  },

  async testLogin(email: string, password: string) {
    try {
      console.log('SimpleAuth: Testing login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('SimpleAuth: Login error:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(`Login failed. This usually means:
1. Wrong password
2. Email not confirmed
3. User doesn't exist

Try registering again or check password.`);
        }
        
        throw error;
      }

      console.log('SimpleAuth: Login successful');
      return data;

    } catch (error) {
      console.error('SimpleAuth: Login failed:', error);
      throw error;
    }
  }
};
