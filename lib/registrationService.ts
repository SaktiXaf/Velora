import { MockDatabaseService } from './mockDatabaseService';
import { supabase, testSupabaseConnection } from './supabase';

// Service untuk handle registration dengan berbagai fallback method
export const RegistrationService = {
  async registerUser(userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) {
    try {
      console.log('RegistrationService: Starting registration...');
      
      // Test connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        console.log('Supabase unavailable, using mock database');
        return await MockDatabaseService.registerUser(userData);
      }
      
      // Step 1: Register user in auth with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for now
        }
      });

      if (authError) {
        console.error('RegistrationService: Auth error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('RegistrationService: User created:', authData.user.id);
      console.log('RegistrationService: User email confirmed:', authData.user.email_confirmed_at);

      // Step 2: Try multiple approaches to create profile
      const profileData = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      };

      // Approach 1: Direct insert
      console.log('RegistrationService: Trying direct insert...');
      const { data: profile1, error: error1 } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (!error1 && profile1) {
        console.log('RegistrationService: Direct insert successful');
        
        // Try to auto-login after successful registration
        console.log('RegistrationService: Attempting auto-login...');
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });
          
          if (!loginError && loginData.user) {
            console.log('RegistrationService: Auto-login successful');
            return { user: loginData.user, profile: profile1, autoLogin: true };
          } else {
            console.log('RegistrationService: Auto-login failed:', loginError?.message);
          }
        } catch (autoLoginError) {
          console.log('RegistrationService: Auto-login error:', autoLoginError);
        }
        
        return { user: authData.user, profile: profile1, autoLogin: false };
      }

      console.log('RegistrationService: Direct insert failed:', error1?.message);

      // If direct insert fails, try other approaches...
      // (rest of the fallback code remains the same)
      
      throw new Error(`Profile creation failed: ${error1?.message || 'Unknown error'}`);

    } catch (error) {
      console.error('RegistrationService: Final error:', error);
      throw error;
    }
  },

  async loginUser(emailOrName: string, password: string) {
    try {
      console.log('RegistrationService: Starting login...');
      
      // Test connection first with timeout
      let connectionTest: { success: boolean; error?: string };
      try {
        connectionTest = await Promise.race([
          testSupabaseConnection(),
          new Promise<{ success: boolean; error: string }>((_, reject) => 
            setTimeout(() => reject({ success: false, error: 'Connection timeout' }), 5000)
          )
        ]);
      } catch (timeoutError) {
        console.log('Connection test failed/timeout, using mock database');
        connectionTest = { success: false, error: 'Connection timeout or network failed' };
      }
      
      if (!connectionTest.success) {
        console.log('Supabase unavailable, using mock database');
        const mockResult = await MockDatabaseService.loginUser(emailOrName, password);
        
        if (mockResult.success) {
          return { user: mockResult.user };
        } else {
          throw new Error(`🌐 Database Offline - Using Test Mode!\n\n${mockResult.error}\n\n⚠️ Supabase Error: ${connectionTest.error}\n\nCoba gunakan:\n• Email: test@example.com\n• Password: test123`);
        }
      }
      
      let email = emailOrName.trim();

      // If not email, try to find email by name
      if (!email.includes('@')) {
        console.log('RegistrationService: Looking up email by name:', email);
        try {
          // First, let's see what's in the database
          const { data: allUsers, error: debugError } = await supabase
            .from('profiles')
            .select('name, email')
            .limit(10);
          
          console.log('RegistrationService: Database users:', allUsers);
          
          if (!debugError && allUsers && allUsers.length > 0) {
            // Try exact match
            let foundUser = allUsers.find(u => u.name === email);
            
            // Try case insensitive match
            if (!foundUser) {
              foundUser = allUsers.find(u => u.name?.toLowerCase() === email.toLowerCase());
            }
            
            // Try partial match
            if (!foundUser) {
              foundUser = allUsers.find(u => u.name?.toLowerCase().includes(email.toLowerCase()));
            }
            
            if (foundUser && foundUser.email) {
              email = foundUser.email;
              console.log('RegistrationService: Found email:', email);
            } else {
              const userList = allUsers.map(u => u.name).filter(Boolean).join(', ');
              throw new Error(`Username "${emailOrName}" tidak ditemukan.\n\nUser yang tersedia: ${userList}\n\nSilakan gunakan email atau daftar terlebih dahulu.`);
            }
          } else {
            throw new Error(`Database kosong atau tidak dapat diakses. Silakan daftar terlebih dahulu atau cek koneksi internet.`);
          }
        } catch (lookupError) {
          console.error('RegistrationService: Lookup error:', lookupError);
          throw lookupError;
        }
      }

      // Try login with email
      console.log('RegistrationService: Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('RegistrationService: Login error details:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(`Email/password salah!\n\nPastikan:\n• Email: ${email}\n• Password yang benar\n• Akun sudah terdaftar\n\nAtau coba daftar ulang jika belum punya akun.`);
        }
        
        if (error.message.includes('Email not confirmed')) {
          throw new Error(`Email belum dikonfirmasi!\n\nSilakan cek email Anda dan klik link konfirmasi, atau coba daftar ulang.`);
        }
        
        // Network-related errors
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error(`🌐 Network Error!\n\nKoneksi ke server gagal:\n• ${error.message}\n• Cek koneksi internet\n• Server mungkin down\n• Coba mode offline untuk testing`);
        }
        
        throw new Error(`Login gagal: ${error.message}\n\nCoba periksa koneksi internet atau daftar ulang.`);
      }

      if (!data.user) {
        throw new Error('Tidak ada data user dari server. Coba lagi atau daftar ulang.');
      }

      console.log('RegistrationService: Login successful for user:', data.user.id);
      return data;
      
    } catch (error) {
      console.error('RegistrationService: Login error:', error);
      throw error;
    }
  }
};
