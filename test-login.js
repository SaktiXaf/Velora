// Quick test untuk check apakah AuthService bisa diimport dan berfungsi
const { supabase } = require('./lib/supabase');

console.log('Testing Supabase connection...');

async function testLogin() {
  try {
    console.log('Testing direct Supabase login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (error) {
      console.log('Expected error (user not found):', error.message);
    } else {
      console.log('Login success:', data);
    }
  } catch (error) {
    console.log('Caught error:', error.message);
  }
}

testLogin();
