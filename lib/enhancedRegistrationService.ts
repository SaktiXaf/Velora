import { MockDatabaseService } from './mockDatabaseService';
import { supabase, testSupabaseConnection, testUsersTable } from './supabase';

// Interface untuk data registrasi
interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

// Interface untuk user yang akan disimpan ke database
interface UserDatabaseRecord {
  id?: string;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  avatar?: string;
  age?: number;
  is_active: boolean;
}

// Service untuk handle registration dengan direct database integration
export const EnhancedRegistrationService = {
  async registerUser(userData: RegistrationData) {
    try {
      console.log('🚀 EnhancedRegistrationService: Starting registration process...');
      console.log('📝 Registration data:', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address
      });
      
      // Test connection first
      console.log('🔍 Testing database connection and users table...');
      const connectionTest = await testSupabaseConnection();
      const usersTableTest = await testUsersTable();
      
      console.log('📊 Connection test result:', connectionTest);
      console.log('📊 Users table test result:', usersTableTest);
      
      if (!connectionTest.success) {
        console.log('📱 Supabase unavailable, using mock database');
        return await MockDatabaseService.registerUser(userData);
      }
      
      if (!usersTableTest.success || !usersTableTest.tableExists) {
        console.error('❌ Users table is not available:', usersTableTest.error);
        throw new Error(`Database setup incomplete: ${usersTableTest.error}`);
      }

      console.log('💎 Supabase available, proceeding with real registration...');
      
      // Enhanced connection test - verify we can access the correct database
      console.log('🔍 Testing detailed database connection...');
      try {
        const { data: dbTest, error: dbTestError } = await supabase
          .rpc('version'); // Get PostgreSQL version to confirm connection
        
        console.log('📊 Database version test:', { data: dbTest, error: dbTestError });
      } catch (dbTestErr) {
        console.log('⚠️ Database version test failed (not critical):', dbTestErr);
      }
      
      // Test if we can access the users table specifically
      console.log('🔍 Testing users table access...');
      try {
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        console.log('📊 Users table count test:', { count, error: countError });
        
        if (countError) {
          console.error('❌ Users table is not accessible:', countError);
          throw new Error(`Users table not accessible: ${countError.message}`);
        } else {
          console.log(`✅ Users table accessible, current count: ${count}`);
        }
      } catch (tableTestErr) {
        console.error('❌ Fatal: Cannot access users table:', tableTestErr);
        throw new Error(`Users table not available: ${tableTestErr}`);
      }
      
      // Step 1: Register user in Supabase Auth
      console.log('🔐 Step 1: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            name: userData.name,
            full_name: userData.name,
          }
        }
      });

      if (authError) {
        console.error('❌ Auth registration error:', authError);
        throw new Error(`Authentication registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication signup');
      }

      const userId = authData.user.id;
      console.log('✅ Auth user created successfully with ID:', userId);

      // Step 1.5: Try to sign in user to establish session for RLS (optional)
      console.log('🔐 Step 1.5: Attempting to sign in user to establish session...');
      let signInSuccess = false;
      
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (signInError) {
          console.log('⚠️ Sign in after registration failed (expected for email confirmation):', signInError.message);
          // This is expected if email confirmation is required
        } else if (signInData.user) {
          console.log('✅ User signed in successfully, session established');
          signInSuccess = true;
        }
      } catch (signInErr) {
        console.log('⚠️ Sign in attempt failed (continuing without session):', signInErr);
      }

      // Step 2: Save user data to users table
      console.log('📊 Step 2: Saving user data to users table...');
      
      // First, let's check if the users table exists and is accessible
      console.log('🔍 Checking if users table exists and is accessible...');
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (tableError) {
          console.error('❌ Users table check failed:', tableError);
          console.error('❌ Table error details:', {
            message: tableError.message,
            code: tableError.code,
            details: tableError.details,
            hint: tableError.hint
          });
          throw new Error(`Users table not accessible: ${tableError.message}`);
        } else {
          console.log('✅ Users table exists and is accessible');
        }
      } catch (tableCheckError) {
        console.error('❌ Fatal error checking users table:', tableCheckError);
        throw new Error(`Cannot access users table: ${tableCheckError}`);
      }
      
      // Generate username from email (before @)
      const baseUsername = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      
      // Check if username already exists and create unique one if needed
      console.log('🔍 Checking username availability for:', username);
      try {
        const { data: existingUser, error: usernameCheckError } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();
        
        if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking username:', usernameCheckError);
        }
        
        if (existingUser) {
          username = `${baseUsername}_${Date.now().toString().slice(-4)}`;
          console.log('📝 Username already exists, generated new one:', username);
        } else {
          console.log('✅ Username available:', username);
        }
      } catch (usernameError) {
        console.error('❌ Username check failed:', usernameError);
        // Continue with original username if check fails
      }
      
      // Create user record for database
      const userRecord: UserDatabaseRecord = {
        id: userId, // Use auth user ID
        email: userData.email,
        name: userData.name,
        username: username,
        bio: `New BlueTrack user from ${userData.address}. Phone: ${userData.phone}`,
        avatar: undefined,
        age: undefined,
        is_active: true
      };

      console.log('📝 Inserting user record to users table:', {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        username: userRecord.username,
        bio: userRecord.bio
      });
      
      console.log('🚀 Executing INSERT query to users table...');
      const { data: userInsertData, error: userInsertError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

      console.log('📊 Insert query result:', {
        data: userInsertData,
        error: userInsertError,
        hasData: !!userInsertData,
        hasError: !!userInsertError
      });

      if (userInsertError) {
        console.error('❌ Error inserting user to database:', userInsertError);
        console.error('❌ Insert error details:', {
          message: userInsertError.message,
          code: userInsertError.code,
          details: userInsertError.details,
          hint: userInsertError.hint
        });
        
        // Try to clean up auth user if database insert fails
        try {
          console.log('🧹 Cleaning up auth user due to database insert failure...');
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) {
            console.error('❌ Failed to cleanup auth user:', deleteError);
          } else {
            console.log('✅ Auth user cleaned up successfully');
          }
        } catch (cleanupError) {
          console.error('❌ Error during auth user cleanup:', cleanupError);
        }
        
        throw new Error(`Database registration failed: ${userInsertError.message}`);
      }

      console.log('✅ User data saved to database successfully:', userInsertData);

      // Step 2.5: Verify the user was actually saved by querying it back
      console.log('🔍 Verifying user was actually saved to database...');
      try {
        const { data: verifyUser, error: verifyError } = await supabase
          .from('users')
          .select('id, email, name, username, created_at')
          .eq('id', userId)
          .single();
        
        if (verifyError) {
          console.error('❌ User verification failed:', verifyError);
          throw new Error(`User was not saved properly: ${verifyError.message}`);
        }
        
        if (verifyUser) {
          console.log('✅ CONFIRMED: User exists in database:', verifyUser);
        } else {
          console.error('❌ User not found in database after insert!');
          throw new Error('User was not saved to database despite no error');
        }
      } catch (verifyErr) {
        console.error('❌ Critical: User verification failed:', verifyErr);
        throw new Error(`User save verification failed: ${verifyErr}`);
      }

      // Step 3: Auto-confirm email to enable immediate login
      console.log('📧 Step 3: Attempting auto-confirmation for immediate login...');
      
      // Wait a moment for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to confirm email via RPC function (if available)
      try {
        const { error: confirmError } = await supabase.rpc('confirm_user_email', {
          user_email: userData.email
        });
        
        if (confirmError) {
          console.log('⚠️ Email confirmation function not available:', confirmError.message);
        } else {
          console.log('✅ Email auto-confirmed via RPC function');
        }
      } catch (confirmErr) {
        console.log('⚠️ RPC email confirmation failed:', confirmErr);
      }

      // Step 4: Attempt auto-login to verify everything works
      console.log('🔑 Step 4: Testing auto-login to verify registration...');
      
      let loginSuccess = false;
      let loginData = null;
      
      // Try auto-login up to 3 times with increasing delays
      for (let loginAttempt = 1; loginAttempt <= 3; loginAttempt++) {
        console.log(`🔑 Auto-login attempt ${loginAttempt}/3`);
        
        try {
          // Wait progressively longer between attempts
          if (loginAttempt > 1) {
            const delay = loginAttempt * 1500;
            console.log(`⏱️ Waiting ${delay}ms before login attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const { data: attemptLoginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });
          
          if (!loginError && attemptLoginData.user) {
            console.log(`✅ Auto-login successful on attempt ${loginAttempt}`);
            loginSuccess = true;
            loginData = attemptLoginData;
            break;
          } else {
            console.log(`❌ Auto-login attempt ${loginAttempt} failed:`, loginError?.message);
          }
        } catch (autoLoginError) {
          console.log(`❌ Auto-login attempt ${loginAttempt} error:`, autoLoginError);
        }
      }

      // Step 5: Return registration result
      const registrationResult = {
        success: true,
        userId: userId,
        userData: userInsertData,
        authData: authData,
        autoLoginSuccess: loginSuccess,
        loginData: loginData,
        message: loginSuccess 
          ? 'Registration successful! You are now logged in.' 
          : 'Registration successful! Please login manually.'
      };

      console.log('🎉 Registration completed successfully!', {
        userId: userId,
        username: username,
        autoLoginSuccess: loginSuccess
      });

      return registrationResult;

    } catch (error) {
      console.error('💥 Registration failed:', error);
      throw error;
    }
  },

  // Helper method to check if email already exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      return !!data && !error;
    } catch (error) {
      console.log('Error checking email existence:', error);
      return false;
    }
  },

  // Helper method to check if username already exists
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      
      return !!data && !error;
    } catch (error) {
      console.log('Error checking username existence:', error);
      return false;
    }
  }
};
