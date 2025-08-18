// Debug script untuk test user creation
// Run this in browser console atau sebagai standalone Node.js script

import { supabase } from './lib/supabase.js';

async function debugUserCreation() {
  console.log('🔍 Starting user creation debug...');
  
  try {
    // 1. Test database connection
    console.log('📡 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // 2. Check current session
    console.log('🔐 Checking current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session details:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id || 'none',
      userEmail: sessionData.session?.user?.email || 'none',
      sessionValid: !!sessionData.session?.access_token
    });
    
    if (!sessionData.session) {
      console.log('⚠️ No active session. Need to login first.');
      
      // Try to sign up a test user
      console.log('📝 Attempting test registration...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpass123'
      });
      
      if (signUpError) {
        console.error('❌ Test registration failed:', signUpError);
        return;
      }
      
      console.log('✅ Test registration successful:', signUpData.user?.email);
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpass123'
      });
      
      if (signInError) {
        console.error('❌ Test sign in failed:', signInError);
        return;
      }
      
      console.log('✅ Test sign in successful');
    }
    
    // 3. Get fresh session after sign in
    const { data: freshSession } = await supabase.auth.getSession();
    
    if (!freshSession.session) {
      console.error('❌ Still no session after sign in');
      return;
    }
    
    const userId = freshSession.session.user.id;
    const userEmail = freshSession.session.user.email;
    
    // 4. Test user profile creation
    console.log('👤 Testing user profile creation...');
    const testUserData = {
      id: userId,
      email: userEmail,
      name: 'Test User',
      address: 'Test Address',
      age: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([testUserData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ User profile creation failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // If duplicate, try update
      if (insertError.code === '23505') {
        console.log('⚠️ User already exists, trying update...');
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ name: 'Updated Test User', updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Update also failed:', updateError);
        } else {
          console.log('✅ User profile updated successfully:', updateData);
        }
      }
    } else {
      console.log('✅ User profile created successfully:', insertData);
    }
    
    // 5. Verify by fetching the user
    console.log('🔍 Verifying user creation by fetching...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('❌ User fetch failed:', fetchError);
    } else {
      console.log('✅ User fetch successful:', fetchData);
    }
    
    // 6. Check RLS policies
    console.log('🔒 Checking RLS policies...');
    const { data: policyData, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'users' });
    
    if (policyError) {
      console.log('⚠️ Could not fetch policies:', policyError);
    } else {
      console.log('📋 RLS Policies:', policyData);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugUserCreation();
