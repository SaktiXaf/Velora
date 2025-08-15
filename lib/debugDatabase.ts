import { supabase, testSupabaseConnection, testUsersTable } from './supabase';

// Debug script untuk test database connection dan tabel users
export const debugDatabaseConnection = async () => {
  console.log('🔧 === DEBUG DATABASE CONNECTION ===');
  
  try {
    // Test 1: Basic connection
    console.log('\n🔍 Test 1: Basic Supabase Connection');
    const connectionResult = await testSupabaseConnection();
    console.log('Connection result:', connectionResult);
    
    // Test 2: Users table accessibility
    console.log('\n🔍 Test 2: Users Table Accessibility');
    const usersTableResult = await testUsersTable();
    console.log('Users table result:', usersTableResult);
    
    // Test 3: Direct query to users table
    console.log('\n🔍 Test 3: Direct Users Table Query');
    try {
      const { data: users, error: usersError, count } = await supabase
        .from('users')
        .select('id, email, name, username, created_at', { count: 'exact' })
        .limit(5);
      
      console.log('Direct query result:', {
        data: users,
        error: usersError,
        count: count,
        hasData: !!users,
        dataLength: users?.length || 0
      });
      
      if (users && users.length > 0) {
        console.log('📊 Sample users found:', users);
      } else {
        console.log('📋 No users found in table');
      }
    } catch (directError) {
      console.error('❌ Direct query failed:', directError);
    }
    
    // Test 4: Database info
    console.log('\n🔍 Test 4: Database Information');
    try {
      const { data: dbInfo, error: dbError } = await supabase.rpc('version');
      console.log('Database version:', { data: dbInfo, error: dbError });
    } catch (versionError) {
      console.log('Database version check failed:', versionError);
    }
    
    // Test 5: Auth status
    console.log('\n🔍 Test 5: Auth Status');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth session:', {
      hasSession: !!authData.session,
      user: authData.session?.user?.email || 'No user',
      error: authError
    });
    
    console.log('\n✅ === DEBUG COMPLETE ===');
    
    return {
      connectionOk: connectionResult.success,
      usersTableOk: usersTableResult.success,
      usersTableExists: usersTableResult.tableExists,
      summary: `Connection: ${connectionResult.success ? '✅' : '❌'}, Users Table: ${usersTableResult.success ? '✅' : '❌'}`
    };
    
  } catch (error) {
    console.error('💥 Debug script failed:', error);
    return {
      connectionOk: false,
      usersTableOk: false,
      usersTableExists: false,
      error: error
    };
  }
};

// Simple test untuk insert user
export const testUserInsert = async () => {
  console.log('\n🧪 === TEST USER INSERT ===');
  
  const testUser = {
    id: `test_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    username: `testuser_${Date.now()}`,
    bio: 'Test user for debugging',
    is_active: true
  };
  
  console.log('📝 Attempting to insert test user:', testUser);
  
  try {
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    console.log('Insert result:', {
      data: insertResult,
      error: insertError,
      success: !insertError && !!insertResult
    });
    
    if (insertResult) {
      console.log('✅ Test user inserted successfully!');
      
      // Verify by querying back
      const { data: verifyResult, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single();
      
      console.log('Verification result:', {
        data: verifyResult,
        error: verifyError,
        found: !!verifyResult
      });
      
      // Clean up test user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id);
      
      console.log('Cleanup result:', { deleteError });
      
      return true;
    } else {
      console.error('❌ Test user insert failed:', insertError);
      return false;
    }
  } catch (error) {
    console.error('💥 Test insert failed:', error);
    return false;
  }
};
