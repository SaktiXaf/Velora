// Mock database service untuk fallback ketika Supabase tidak tersedia
interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  bio?: string;
  age?: number;
  avatar?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

const mockUsers: MockUser[] = [
  {
    id: 'mock-user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: '123456',
    bio: 'Fitness enthusiast',
    age: 25,
    phone: '08123456789',
    address: 'Jakarta',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-user-2',
    name: 'testuser',
    email: 'test@example.com',
    password: 'test123',
    bio: 'Test user for development',
    age: 30,
    phone: '08123456790',
    address: 'Bandung',
    created_at: new Date().toISOString()
  }
];

export const MockDatabaseService = {
  async loginUser(emailOrName: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('MockDatabase: Attempting login with:', emailOrName);
      
      // Find user by email or name
      const user = mockUsers.find(u => 
        u.email.toLowerCase() === emailOrName.toLowerCase() || 
        u.name.toLowerCase() === emailOrName.toLowerCase()
      );
      
      if (!user) {
        const availableUsers = mockUsers.map(u => `${u.name} (${u.email})`).join(', ');
        return {
          success: false,
          error: `User tidak ditemukan!\n\nAvailable test users:\n${availableUsers}\n\nAtau gunakan:\n• Email: test@example.com\n• Password: test123`
        };
      }
      
      if (user.password !== password) {
        return {
          success: false,
          error: `Password salah!\n\nUntuk user ${user.name}:\n• Email: ${user.email}\n• Password: ${user.password}`
        };
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('MockDatabase: Login successful for:', user.name);
      return {
        success: true,
        user: userWithoutPassword
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Mock database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
  
  async registerUser(userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = mockUsers.find(u => 
        u.email.toLowerCase() === userData.email.toLowerCase() ||
        u.name.toLowerCase() === userData.name.toLowerCase()
      );
      
      if (existingUser) {
        return {
          success: false,
          error: `User sudah ada!\n\nExisting user:\n• Name: ${existingUser.name}\n• Email: ${existingUser.email}`
        };
      }
      
      // Create new user
      const newUser: MockUser = {
        id: `mock-user-${Date.now()}`,
        ...userData,
        created_at: new Date().toISOString()
      };
      
      mockUsers.push(newUser);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      
      console.log('MockDatabase: User registered successfully:', newUser.name);
      return {
        success: true,
        user: userWithoutPassword
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
  
  getAllUsers(): { name: string; email: string }[] {
    return mockUsers.map(u => ({ name: u.name, email: u.email }));
  },
  
  getUserCount(): number {
    return mockUsers.length;
  }
};
