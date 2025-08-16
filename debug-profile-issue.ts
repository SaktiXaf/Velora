import { supabase } from './lib/supabase';

// Debug function untuk troubleshoot PGRST116 error
const debugProfileIssue = async (userId: string, email: string) => {
  console.log('🔍 Debug Profile Issue - User ID:', userId);
  console.log('📧 Email:', email);
  
  try {
    // 1. Check if users table exists
    console.log('\n1. Checking users table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Users table error:', tableError);
      return;
    }
    console.log('✅ Users table accessible');
    
    // 2. Check if user exists
    console.log('\n2. Checking if user exists...');
    const { data: userCheck, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (userError) {
      console.error('❌ Error checking user:', userError);
    } else {
      console.log(`✅ User query result: ${userCheck.length} users found`);
      if (userCheck.length > 0) {
        console.log('👤 Existing user:', userCheck[0]);
      }
    }
    
    // 3. Try to create user if doesn't exist
    if (!userCheck || userCheck.length === 0) {
      console.log('\n3. Creating user...');
      const newUser = {
        id: userId,
        email: email,
        name: email.split('@')[0],
        bio: ''
      };
      
      const { data: createData, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select('*')
        .single();
      
      if (createError) {
        console.error('❌ Error creating user:', createError);
      } else {
        console.log('✅ User created successfully:', createData);
      }
    }
    
    // 4. Try to update user
    console.log('\n4. Testing update...');
    const testUpdate = {
      name: 'Test User ' + Date.now(),
      bio: 'Test bio'
    };
    
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update(testUpdate)
      .eq('id', userId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log('✅ Update successful:', updateData);
    }
    
    // 5. Final verification
    console.log('\n5. Final verification...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (finalError) {
      console.error('❌ Final check error:', finalError);
    } else {
      console.log('✅ Final user state:', finalCheck);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
};

// Export function untuk digunakan di console
export { debugProfileIssue };

// Usage example:
// debugProfileIssue('your-user-id-here', 'user@example.com');
