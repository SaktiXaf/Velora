// Simple offline auth for testing when network fails
export class OfflineAuth {
  static async offlineLogin(emailOrName: string, password: string) {
    console.log('=== OFFLINE LOGIN ATTEMPT ===');
    
    // Simple offline user simulation
    const mockUser = {
      id: 'offline-user-' + Date.now(),
      email: emailOrName.includes('@') ? emailOrName : emailOrName + '@offline.local',
      name: emailOrName.includes('@') ? emailOrName.split('@')[0] : emailOrName,
      created_at: new Date().toISOString()
    };
    
    console.log('Created offline user:', mockUser);
    
    return {
      success: true,
      user: mockUser,
      message: 'Login berhasil dengan mode offline!'
    };
  }
  
  static async createOfflineSession() {
    const sessionData = {
      access_token: 'offline-token-' + Date.now(),
      refresh_token: 'offline-refresh-' + Date.now(),
      user: {
        id: 'offline-user-' + Date.now(),
        email: 'offline@test.com',
        created_at: new Date().toISOString()
      }
    };
    
    return {
      session: sessionData,
      user: sessionData.user
    };
  }
}
