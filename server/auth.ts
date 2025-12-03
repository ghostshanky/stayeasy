import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './lib/prisma'
import { AuditLogger } from './audit-logger.js'

export type Role = 'TENANT' | 'OWNER' | 'ADMIN'

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: Role
  emailVerified: boolean
  emailToken?: string | null
  emailTokenExpiry?: Date | null
  image_id?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  emailVerified: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'stay-easy-secret'
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'stay-easy-refresh-secret'
  private static readonly JWT_EXPIRES_IN = '15m'
  private static readonly JWT_REFRESH_EXPIRES_IN = '30d'

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(user: AuthUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN })
  }

  static generateRefreshToken(user: AuthUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    }
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: this.JWT_REFRESH_EXPIRES_IN })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async createUser(email: string, password: string, name: string, role: Role = 'TENANT'): Promise<User> {
    console.log('🔐 [AuthService.createUser] Creating user:', { email, name, role })

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('⚠️ [AuthService.createUser] Email already exists:', email)
      throw new Error('Email already exists')
    }

    const hashedPassword = await this.hashPassword(password)
    const emailToken = this.generateEmailToken()
    console.log('✅ [AuthService.createUser] Password hashed, email token generated')

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          emailToken,
          emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      })

      console.log('✅ [AuthService.createUser] User created successfully:', user.id)

      // Create audit log
      await AuditLogger.logUserAction(user.id, 'USER_SIGNUP', `User ${name} (${email}) signed up with role ${role}`)

      return {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        emailToken: user.emailToken,
        emailTokenExpiry: user.emailTokenExpiry,
        image_id: user.imageId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    } catch (error: any) {
      console.error('❌ [AuthService.createUser] Failed to create user:', error)
      throw new Error(`Failed to create user: ${error.message}`)
    }
  }

  static async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    console.log('🔍 [AuthService.authenticateUser] Attempting to authenticate user:', email)

    try {
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        console.log('⚠️ [AuthService.authenticateUser] User not found:', email)
        return null
      }

      const passwordValid = await this.verifyPassword(password, user.password)
      console.log('🔐 [AuthService.authenticateUser] Password validation result:', passwordValid)

      if (!passwordValid) {
        console.log('❌ [AuthService.authenticateUser] Invalid password for user:', email)
        return null
      }

      console.log('✅ [AuthService.authenticateUser] User authenticated successfully:', user.id)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    } catch (error) {
      console.error('❌ [AuthService.authenticateUser] Error fetching user:', error)
      return null
    }
  }

  static async verifyEmailToken(token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          emailToken: token,
          emailTokenExpiry: { gt: new Date() }
        }
      })

      if (!user) {
        return false
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailToken: null,
          emailTokenExpiry: null,
        }
      })

      // Create audit log
      await AuditLogger.logUserAction(user.id, 'EMAIL_VERIFIED', `User ${user.name} (${user.email}) verified email`)

      return true
    } catch (error) {
      return false
    }
  }

  static async getUserById(id: string): Promise<AuthUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    } catch (error) {
      return null
    }
  }

  static async createSession(user: AuthUser, ip?: string, device?: string): Promise<{ accessToken: string, refreshToken: string }> {
    console.log('🎯 [AuthService.createSession] Creating session for user:', user.id)

    const accessToken = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)
    const hashedRefreshToken = await this.hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    console.log('🔐 [AuthService.createSession] Generated tokens, inserting into sessions table')

    try {
      console.log('🔍 [AuthService.createSession] Attempting to create refresh token in DB...')
      // Use refresh_tokens table as primary session storage
      await prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          expiresAt: expiresAt,
          userId: user.id,
          ip,
          device,
        }
      })

      console.log('✅ [AuthService.createSession] Session created successfully in DB')

      // Create audit log
      console.log('🔍 [AuthService.createSession] Attempting to log user action...')
      await AuditLogger.logUserAction(user.id, 'USER_LOGIN', `User ${user.name} (${user.email}) logged in${device ? ` from device ${device}` : ''}${ip ? ` with IP ${ip}` : ''}`)
      console.log('✅ [AuthService.createSession] User action logged')

      return { accessToken, refreshToken }
    } catch (error: any) {
      console.error('❌ [AuthService.createSession] Critical session creation error:', error)
      console.error('Stack:', error.stack)
      if (error.code) console.error('Error Code:', error.code)
      if (error.meta) console.error('Error Meta:', error.meta)
      throw new Error(`Failed to create session: ${error.message}`)
    }
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    const payload = this.verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await this.getUserById(payload.userId)
    return user
  }

  static async refreshToken(refreshToken: string, ip?: string, device?: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    const payload = this.verifyRefreshToken(refreshToken)
    if (!payload) {
      return null
    }

    try {
      // Find all valid refresh tokens for this user
      const allTokens = await prisma.refreshToken.findMany({
        where: {
          userId: payload.userId,
          expiresAt: { gt: new Date() }
        }
      })

      if (allTokens.length === 0) {
        return null
      }

      let validTokenEntry = null;
      for (const tokenEntry of allTokens) {
        if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
          validTokenEntry = tokenEntry;
          break;
        }
      }

      if (!validTokenEntry) {
        // If token is not found but payload was valid, it might be a stolen token.
        // Invalidate all tokens for this user as a security measure.
        await prisma.refreshToken.deleteMany({
          where: { userId: payload.userId }
        })
        return null;
      }

      // The token is valid, proceed with rotation.
      // Invalidate the used token.
      await prisma.refreshToken.delete({
        where: { id: validTokenEntry.id }
      })

      const user = await this.getUserById(payload.userId);
      if (!user) {
        return null;
      }

      // Create new tokens
      const newTokens = await this.createSession(user, ip, device)

      // Create audit log
      await AuditLogger.logUserAction(user.id, 'TOKEN_REFRESH', `User ${user.name} (${user.email}) refreshed token`)

      return newTokens
    } catch (error) {
      console.error('❌ [AuthService.refreshToken] Error:', error)
      return null
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    const payload = this.verifyRefreshToken(refreshToken)
    if (!payload) {
      return
    }

    try {
      // Find the specific token to delete
      const refreshTokens = await prisma.refreshToken.findMany({
        where: { userId: payload.userId }
      })

      let tokenToDelete = null;
      for (const tokenEntry of refreshTokens) {
        if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
          tokenToDelete = tokenEntry;
          break;
        }
      }

      if (tokenToDelete) {
        await prisma.refreshToken.delete({
          where: { id: tokenToDelete.id }
        })
      }

      // Create audit log
      const user = await this.getUserById(payload.userId)
      if (user) {
        await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
      }
    } catch (error) {
      console.error('❌ [AuthService.logout] Error:', error)
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { userId }
      })

      // Create audit log
      const user = await this.getUserById(userId)
      if (user) {
        await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
      }
    } catch (error) {
      console.error('❌ [AuthService.logoutAll] Error:', error)
    }
  }

  private static generateEmailToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
