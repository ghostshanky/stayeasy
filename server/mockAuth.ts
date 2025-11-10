import { AuthUser } from './auth.js'

// Mock users for development - make it exportable so we can add to it from other files
let mockUsers: AuthUser[] = [
  {
    id: '1',
    email: 'tenant@example.com',
    name: 'John Tenant',
    role: 'TENANT',
    emailVerified: true,
  },
  {
    id: '2',
    email: 'owner@example.com',
    name: 'Jane Owner',
    role: 'OWNER',
    emailVerified: true,
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    emailVerified: true,
  },
]

// Export the users array so we can modify it from other modules
export { mockUsers }

export class MockAuthService {
  static async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    // For development, accept any non-empty password for mock users
    let user = mockUsers.find(u => u.email === email)
    if (user && password && password.trim() !== '') {
      return user
    }
    // If user not found but password provided, create the user on the fly for login
    if (!user && password && password.trim() !== '') {
      user = await this.createUser(email, password, 'Test User', 'TENANT')
      return user || null
    }
    return null
  }

  static async createUser(email: string, password: string, name: string, role: 'TENANT' | 'OWNER' | 'ADMIN' = 'TENANT'): Promise<AuthUser> {
    const newUser: AuthUser = {
      id: (mockUsers.length + 1).toString(),
      email,
      name,
      role,
      emailVerified: true,
    }
    mockUsers.push(newUser)
    return newUser
  }

  static async getUserById(id: string): Promise<AuthUser | null> {
    return mockUsers.find(u => u.id === id) || null
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    // For development, extract user ID from token and return the correct user
    const payload = this.verifyToken(token)
    if (payload && payload.userId) {
      return this.getUserById(payload.userId)
    }
    return null
  }

  static generateToken(user: AuthUser): string {
    return `mock-token-${user.id}`
  }

  static generateRefreshToken(user: AuthUser): string {
    return `mock-refresh-token-${user.id}`
  }

  static verifyToken(token: string): any {
    return { userId: token.split('-')[2] }
  }

  static verifyRefreshToken(token: string): any {
    return { userId: token.split('-')[2] }
  }

  static async createSession(user: AuthUser): Promise<{ accessToken: string, refreshToken: string }> {
    return {
      accessToken: this.generateToken(user),
      refreshToken: this.generateRefreshToken(user),
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    const payload = this.verifyRefreshToken(refreshToken)
    if (payload) {
      const user = await this.getUserById(payload.userId)
      if (user) {
        return this.createSession(user)
      }
    }
    return null
  }

  static async logout(refreshToken: string): Promise<void> {
    // Mock logout - no-op
  }

  static async logoutAll(userId: string): Promise<void> {
    // Mock logout all - no-op
  }
}