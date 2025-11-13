import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseServer } from './lib/supabaseServer.js'
import { AuditLogger } from './audit-logger.js'

// Check if Supabase is properly configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_URL === 'https://your-project.supabase.co' || 
    process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
  console.warn('⚠️  WARNING: Supabase not properly configured for authentication.')
  console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.')
  console.warn('   Authentication will not work properly.')
}

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
    
    // DIAGNOSTIC: Check if users table exists and has correct schema
    try {
      const { data: tableCheck, error: tableError } = await supabaseServer
        .from('users')
        .select('*')
        .limit(1)
      
      if (tableError) {
        console.error('❌ [AuthService.createUser] Users table access error:', tableError)
        console.error('🔍 [AuthService.createUser] Table error details:', {
          code: tableError.code,
          message: tableError.message,
          details: tableError.details
        })
      } else {
        console.log('✅ [AuthService.createUser] Users table accessible, sample columns:', Object.keys(tableCheck[0] || {}))
      }
    } catch (err) {
      console.error('❌ [AuthService.createUser] Critical table access error:', err)
    }
    
    // Check email uniqueness
    const { data: existingUser, error: existingUserError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ [AuthService.createUser] Error checking existing user:', existingUserError)
      console.error('🔍 [AuthService.createUser] Existing user error details:', {
        code: existingUserError.code,
        message: existingUserError.message,
        details: existingUserError.details
      })
    }

    if (existingUser) {
      console.log('⚠️ [AuthService.createUser] Email already exists:', email)
      throw new Error('Email already exists')
    }

    const hashedPassword = await this.hashPassword(password)
    const emailToken = this.generateEmailToken()
    console.log('✅ [AuthService.createUser] Password hashed, email token generated')

    const now = new Date().toISOString()
    const { data: user, error } = await supabaseServer
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        name,
        role,
        email_token: emailToken,
        email_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [AuthService.createUser] Failed to create user:', error)
      throw new Error(`Failed to create user: ${error.message}`)
    }

    console.log('✅ [AuthService.createUser] User created successfully:', user.id)

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'USER_SIGNUP', `User ${name} (${email}) signed up with role ${role}`)

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      emailVerified: user.email_verified,
      emailToken: user.email_token,
      emailTokenExpiry: user.email_token_expiry ? new Date(user.email_token_expiry) : null,
      image_id: user.image_id,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }
  }

  static async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    console.log('🔍 [AuthService.authenticateUser] Attempting to authenticate user:', email)
    
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('❌ [AuthService.authenticateUser] Error fetching user:', error)
      return null
    }

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
      emailVerified: user.email_verified,
    }
  }

  static async verifyEmailToken(token: string): Promise<boolean> {
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email_token', token)
      .gt('email_token_expiry', new Date().toISOString())
      .single()

    if (error || !user) {
      return false
    }

    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        email_verified: true,
        email_token: null,
        email_token_expiry: null,
      })
      .eq('id', user.id)

    if (updateError) {
      return false
    }

    // Create audit log
    await AuditLogger.logUserAction(user.id, 'EMAIL_VERIFIED', `User ${user.name} (${user.email}) verified email`)

    return true
  }

  static async getUserById(id: string): Promise<AuthUser | null> {
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.email_verified,
    }
  }

  static async createSession(user: AuthUser, ip?: string, device?: string): Promise<{ accessToken: string, refreshToken: string }> {
    console.log('🎯 [AuthService.createSession] Creating session for user:', user.id)
    
    const accessToken = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)
    const hashedRefreshToken = await this.hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    console.log('🔐 [AuthService.createSession] Generated tokens, inserting into sessions table')

    // DIAGNOSTIC: Check which table exists
    try {
      // Try sessions table first (existing in schema)
      const { error: sessionsError } = await supabaseServer
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          token: hashedRefreshToken,
          expires_at: expiresAt,
          user_id: user.id,
        })

      if (sessionsError) {
        console.error('❌ [AuthService.createSession] Sessions table error:', sessionsError)
        // Try refresh_tokens table as fallback
        const { error: refreshTokensError } = await supabaseServer
          .from('refresh_tokens')
          .insert({
            id: crypto.randomUUID(),
            token: hashedRefreshToken,
            expiresAt: expiresAt,
            userId: user.id,
            ip,
            device,
          })

        if (refreshTokensError) {
          console.error('❌ [AuthService.createSession] Refresh tokens table error:', refreshTokensError)
          throw new Error(`Failed to create session: Both sessions and refresh_tokens tables failed`)
        }
        console.log('✅ [AuthService.createSession] Session created using refresh_tokens table')
      } else {
        console.log('✅ [AuthService.createSession] Session created using sessions table')
      }
    } catch (error) {
      console.error('❌ [AuthService.createSession] Critical session creation error:', error)
      throw new Error(`Failed to create session: ${error}`)
    }

    console.log('✅ [AuthService.createSession] Session created successfully')

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

    // DIAGNOSTIC: Try both tables for token validation
    let allTokens = []
    let useRefreshTokens = false
    
    try {
      // Try sessions table first
      const { data: sessionsData, error: sessionsError } = await supabaseServer
        .from('sessions')
        .select('*')
        .eq('user_id', payload.userId)
        .gt('expires_at', new Date().toISOString())

      if (sessionsError) {
        throw sessionsError
      }
      
      if (sessionsData && sessionsData.length > 0) {
        allTokens = sessionsData
      }
    } catch (error) {
      console.log('🔄 [AuthService.refreshToken] Sessions table failed, trying refresh_tokens table')
      // Fallback to refresh_tokens table
      const { data: refreshData, error: refreshError } = await supabaseServer
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', payload.userId)
        .gt('expires_at', new Date().toISOString())

      if (refreshError) {
        console.error('❌ [AuthService.refreshToken] Both tables failed:', refreshError)
        return null
      }
      
      if (refreshData && refreshData.length > 0) {
        allTokens = refreshData
        useRefreshTokens = true
      }
    }

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
      if (useRefreshTokens) {
        await supabaseServer.from('refresh_tokens').delete().eq('user_id', payload.userId)
      } else {
        await supabaseServer.from('sessions').delete().eq('user_id', payload.userId)
      }
      return null;
    }

    // The token is valid, proceed with rotation.
    // Invalidate the used token.
    if (useRefreshTokens) {
      await supabaseServer.from('refresh_tokens').delete().eq('id', validTokenEntry.id)
    } else {
      await supabaseServer.from('sessions').delete().eq('id', validTokenEntry.id)
    }

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

    // DIAGNOSTIC: Try both tables for logout
    let useRefreshTokens = false
    
    try {
      // Try sessions table first
      const { data: sessionsData, error: sessionsError } = await supabaseServer
        .from('sessions')
        .select('*')
        .eq('user_id', payload.userId)

      if (sessionsError) {
        throw sessionsError
      }
      
      if (sessionsData && sessionsData.length > 0) {
        // Delete all sessions for this user
        await supabaseServer.from('sessions').delete().eq('user_id', payload.userId)
        return
      }
    } catch (error) {
      console.log('🔄 [AuthService.logout] Sessions table failed, trying refresh_tokens table')
      // Fallback to refresh_tokens table
      const { data: refreshData, error: refreshError } = await supabaseServer
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', payload.userId)

      if (refreshError) {
        console.error('❌ [AuthService.logout] Both tables failed:', refreshError)
        return
      }
      
      if (refreshData && refreshData.length > 0) {
        useRefreshTokens = true
      }
    }

    if (useRefreshTokens) {
      // Find the specific token to delete
      const { data: refreshTokens, error: refreshTokensError } = await supabaseServer
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', payload.userId)

      if (refreshTokensError) {
        return
      }

      let tokenToDelete = null;
      for (const tokenEntry of refreshTokens) {
        if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
          tokenToDelete = tokenEntry;
          break;
        }
      }
      if (tokenToDelete) {
        await supabaseServer.from('refresh_tokens').delete().eq('id', tokenToDelete.id)
      }
    }

    // Create audit log
    const user = await this.getUserById(payload.userId)
    if (user) {
      await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    await supabaseServer.from('refresh_tokens').delete().eq('user_id', userId)

    // Create audit log
    const user = await this.getUserById(userId)
    if (user) {
      await AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`)
    }
  }

  private static generateEmailToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
