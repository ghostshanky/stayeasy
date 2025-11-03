import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient, User, Role } from '@prisma/client'
import { AuditLogger } from './audit-logger.js'

const prisma = new PrismaClient()

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
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
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
    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      throw new Error('Email already exists')
    }

    const hashedPassword = await this.hashPassword(password)
    const emailToken = this.generateEmailToken()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        emailToken,
        emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'USER_SIGNUP', `User ${name} (${email}) signed up with role ${role}`)

    return user
  }

  static async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !(await this.verifyPassword(password, user.password))) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    }
  }

  static async verifyEmailToken(token: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExpiry: {
          gt: new Date(),
        },
      },
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
      },
    })

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'EMAIL_VERIFIED', `User ${user.name} (${user.email}) verified email`)

    return true
  }

  static async getUserById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
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
  }

  static async createSession(user: AuthUser, ip?: string, device?: string): Promise<{ accessToken: string, refreshToken: string }> {
    const accessToken = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)
    const hashedRefreshToken = await this.hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        expiresAt,
        userId: user.id,
        ip,
        device,
      },
    })

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'USER_LOGIN', `User ${user.name} (${user.email}) logged in${device ? ` from device ${device}` : ''}${ip ? ` with IP ${ip}` : ''}`)

    return { accessToken, refreshToken }
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

    const allTokens = await prisma.refreshToken.findMany({
      where: {
        userId: payload.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    let validTokenEntry = null;
    for (const tokenEntry of allTokens) {
      if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
        validTokenEntry = tokenEntry;
        break;
      }
    }

    if (!validTokenEntry) {
      // If token is not found but payload was valid, it might be a stolen token.
      // Invalidate all refresh tokens for this user as a security measure.
      await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      return null;
    }

    // The token is valid, proceed with rotation.
    // Invalidate the used refresh token.
    await prisma.refreshToken.delete({ where: { id: validTokenEntry.id } });

    const user = await this.getUserById(payload.userId);
    if (!user) {
      return null;
    }

    // Create new tokens
    const newTokens = await this.createSession(user, ip, device)

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'TOKEN_REFRESH', `User ${user.name} (${user.email}) refreshed token`)

    return newTokens
  }

  static async logout(refreshToken: string): Promise<void> {
    const payload = this.verifyRefreshToken(refreshToken)
    if (!payload) {
      return
    }

    const allTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.userId },
    });

    // Find the specific token to delete
    let tokenToDelete = null;
    for (const tokenEntry of allTokens) {
      if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
        tokenToDelete = tokenEntry;
        break;
      }
    }
    if (tokenToDelete) {
      await prisma.refreshToken.delete({ where: { id: tokenToDelete.id } });
    }

    // Create audit log
    const user = await this.getUserById(payload.userId)
    if (user) {
      await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })

    // Create audit log
    const user = await this.getUserById(payload.userId)
    if (user) {
      await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
    }
  }  

  private static generateEmailToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
