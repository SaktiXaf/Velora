import { EnhancedRegistrationService } from './enhancedRegistrationService';

// Test registration function untuk debug RLS policy
export async function testRegistrationRLS() {
  console.log('🧪 Testing registration with RLS policy...');
  
  const testUserData = {
    name: 'Test User RLS',
    email: `test-rls-${Date.now()}@example.com`,
    phone: '+1234567890',
    address: 'Test Address',
    password: 'testpassword123'
  };

  try {
    console.log('📝 Attempting registration with test data:', {
      name: testUserData.name,
      email: testUserData.email,
      phone: testUserData.phone,
      address: testUserData.address
    });

    const result = await EnhancedRegistrationService.registerUser(testUserData);
    
    console.log('✅ Registration test result:', result);
    return {
      success: true,
      result: result,
      message: 'Registration test completed successfully'
    };

  } catch (error: any) {
    console.error('❌ Registration test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Registration test failed'
    };
  }
}

// Export untuk digunakan di debugging
export const RegistrationTestTools = {
  testRegistrationRLS,
  async quickTest() {
    console.log('🚀 Running quick registration test...');
    return await testRegistrationRLS();
  }
};
