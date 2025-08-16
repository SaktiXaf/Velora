// Debug script untuk memeriksa profile data di database
// Jalankan dengan: node debug-profile.js

import { supabase } from './lib/supabase.ts';

const debugProfile = async () => {
  console.log('🔍 Starting profile debug...');
  
  try {
    // Test koneksi database
    console.log('\n1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Ambil semua users
    console.log('\n2. Fetching all users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\n📋 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Bio: ${user.bio || 'No bio'}`);
      console.log(`   Age: ${user.age || 'No age'}`);
      console.log(`   Avatar: ${user.avatar ? 'Has avatar' : 'No avatar'}`);
      console.log(`   Created: ${user.created_at}`);
      
      if (user.avatar) {
        console.log(`   Avatar URL: ${user.avatar.substring(0, 50)}...`);
      }
    });
    
    // Test update profile untuk user tertentu (ganti dengan ID user yang sebenarnya)
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n3. Testing profile update for user: ${testUser.id}...`);
      
      const testUpdates = {
        bio: `Test bio updated at ${new Date().toISOString()}`,
        age: 25,
      };
      
      const { error: updateError } = await supabase
        .from('users')
        .update(testUpdates)
        .eq('id', testUser.id);
        
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        console.log('✅ Profile update test successful');
        
        // Verify update
        const { data: updatedUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', testUser.id)
          .single();
          
        if (fetchError) {
          console.error('❌ Error fetching updated user:', fetchError);
        } else {
          console.log('✅ Updated user data:');
          console.log(`   Bio: ${updatedUser.bio}`);
          console.log(`   Age: ${updatedUser.age}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
};

debugProfile().catch(console.error);
