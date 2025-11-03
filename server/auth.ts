import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient, User, Role } from '@prisma/client'

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
  private static readonly JWT_REFRESH_EXPIRES_IN = '7d'

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
    const hashedPassword = await this.hashPassword(password)
    const emailToken = this.generateEmailToken()

    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        emailToken,
        emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })
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

  static async createSession(userId: string): Promise<string> {
    const token = this.generateToken({ id: userId, email: '', name: '', role: 'TENANT', emailVerified: false })
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })

    return token
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    }
  }

  static async invalidateSession(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    })
  }

  private static generateEmailToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
