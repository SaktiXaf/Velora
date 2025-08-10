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

      // Step 1.5: Auto-confirm email to enable login
      console.log('RegistrationService: Auto-confirming email...');
      try {
        const { error: confirmError } = await supabase.rpc('confirm_user_email', {
          user_email: userData.email
        });
        
        if (confirmError) {
          console.log('RegistrationService: Auto-confirm failed, will try SQL approach');
        } else {
          console.log('RegistrationService: Email auto-confirmed successfully');
        }
      } catch (confirmErr) {
        console.log('RegistrationService: Auto-confirm error:', confirmErr);
      }

      // Wait a moment for the auth.users record to be fully committed
      console.log('RegistrationService: Waiting for auth record to be committed...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Try multiple approaches to create profile
      const profileData = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      };

      // Approach 1: Direct insert with retry
      console.log('RegistrationService: Trying direct insert...');
      let profile1, error1;
      
      // Retry up to 3 times with increasing delays
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`RegistrationService: Insert attempt ${attempt}/3`);
        
        const result = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();
          
        profile1 = result.data;
        error1 = result.error;
        
        if (!error1 && profile1) {
          console.log('RegistrationService: Direct insert successful on attempt', attempt);
          break;
        }
        
        if (attempt < 3) {
          console.log(`RegistrationService: Attempt ${attempt} failed, waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Wait 1s, 2s, 3s
        }
      }

      if (!error1 && profile1) {
        console.log('RegistrationService: Direct insert successful');
        
        // Try to auto-login after successful registration with retry
        console.log('RegistrationService: Attempting auto-login with retry...');
        
        let loginSuccess = false;
        let loginData = null;
        
        // Try auto-login up to 3 times with increasing delays
        for (let loginAttempt = 1; loginAttempt <= 3; loginAttempt++) {
          console.log(`RegistrationService: Auto-login attempt ${loginAttempt}/3`);
          
          try {
            // Wait longer for email confirmation to take effect
            if (loginAttempt > 1) {
              await new Promise(resolve => setTimeout(resolve, loginAttempt * 2000));
            }
            
            const { data: attemptLoginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: userData.email,
              password: userData.password,
            });
            
            if (!loginError && attemptLoginData.user) {
              console.log(`RegistrationService: Auto-login successful on attempt ${loginAttempt}`);
              loginSuccess = true;
              loginData = attemptLoginData;
              break;
            } else {
              console.log(`RegistrationService: Auto-login attempt ${loginAttempt} failed:`, loginError?.message);
              
              // If it's credential error, try to confirm email again
              if (loginError?.message?.includes('Invalid login credentials')) {
                console.log('RegistrationService: Retrying email confirmation...');
                try {
                  await supabase.rpc('confirm_user_email', {
                    user_email: userData.email
                  });
                } catch (confirmRetryErr) {
                  console.log('RegistrationService: Email confirm retry failed:', confirmRetryErr);
                }
              }
            }
          } catch (autoLoginError) {
            console.log(`RegistrationService: Auto-login attempt ${loginAttempt} error:`, autoLoginError);
          }
        }
        
        if (loginSuccess && loginData) {
          return { user: loginData.user, profile: profile1, autoLogin: true };
        } else {
          console.log('RegistrationService: All auto-login attempts failed, but registration was successful');
        }
        
        return { user: authData.user, profile: profile1, autoLogin: false };
      }

      console.log('RegistrationService: Direct insert failed:', error1?.message);

      // Approach 2: Try with manual UUID generation (bypass foreign key)
      console.log('RegistrationService: Trying manual UUID generation...');
      const manualProfileData = {
        id: authData.user.id, // Keep the same user ID
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      };

      // Try direct insert without foreign key dependency
      const { data: profile2, error: error2 } = await supabase
        .from('profiles')
        .upsert(manualProfileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (!error2 && profile2) {
        console.log('RegistrationService: Manual UUID insert successful');
        
        // Try to auto-login
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });
          
          if (!loginError && loginData.user) {
            console.log('RegistrationService: Auto-login successful after manual UUID');
            return { user: loginData.user, profile: profile2, autoLogin: true };
          }
        } catch (autoLoginError) {
          console.log('RegistrationService: Auto-login error after manual UUID:', autoLoginError);
        }
        
        return { user: authData.user, profile: profile2, autoLogin: false };
      }

      console.log('RegistrationService: Manual UUID insert failed:', error2?.message);

      // Approach 3: Try with completely new UUID (no foreign key)
      console.log('RegistrationService: Trying with new UUID (no foreign key)...');
      const newProfileData = {
        id: authData.user.id, // Still use auth user ID for consistency
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      };

      // Force insert without foreign key validation
      const { data: profile3, error: error3 } = await supabase.rpc('insert_profile_bypass', {
        profile_data: newProfileData
      });

      if (!error3 && profile3) {
        console.log('RegistrationService: Bypass insert successful');
        return { user: authData.user, profile: profile3, autoLogin: false };
      }

      console.log('RegistrationService: Bypass insert failed, trying raw SQL...');

      // If all else fails, try direct SQL execution
      try {
        const sqlResult = await supabase.rpc('create_profile_direct', {
          user_id: authData.user.id,
          user_name: userData.name,
          user_email: userData.email,
          user_phone: userData.phone,
          user_address: userData.address
        });

        if (!sqlResult.error) {
          console.log('RegistrationService: Direct SQL successful');
          return { 
            user: authData.user, 
            profile: {
              id: authData.user.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              address: userData.address
            }, 
            autoLogin: false 
          };
        }
      } catch (sqlError) {
        console.log('RegistrationService: Direct SQL failed:', sqlError);
      }

      // If everything fails, throw the original error
      throw new Error(`Profile creation failed: ${error1?.message || 'All methods failed'}`);

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
