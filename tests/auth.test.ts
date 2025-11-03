import request from 'supertest'
import express from 'express'
import { AuthService } from '../server/auth.js'
import { requireAuth, requireRole } from '../server/middleware.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express()
app.use(express.json())

// Auth middleware for testing
app.use(async (req: any, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    req.currentUser = await AuthService.validateSession(token)
  }
  next()
})

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    const user = await AuthService.createUser(email, password, name, role)
    res.json({ message: 'User created successfully', userId: user.id })
  } catch (error) {
    res.status(400).json({ error: 'User creation failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await AuthService.authenticateUser(email, password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = await AuthService.createSession(user.id)
    res.json({ token, user })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.currentUser })
})

app.get('/api/admin', requireRole(['ADMIN']), (req, res) => {
  res.json({ message: 'Admin access granted' })
})

describe('Authentication Flow', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'TENANT',
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'User created successfully')
      expect(response.body).toHaveProperty('userId')

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      })
      expect(user).toBeTruthy()
      expect(user?.name).toBe('Test User')
      expect(user?.role).toBe('TENANT')
    })

    it('should handle duplicate email', async () => {
      // First create a user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'TENANT',
        })

      // Try to create again with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User 2',
          role: 'TENANT',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'User creation failed')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await AuthService.createUser('login@example.com', 'password123', 'Login User', 'TENANT')
    })

    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('login@example.com')
      expect(response.body.user.name).toBe('Login User')
      expect(response.body.user.role).toBe('TENANT')
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Invalid credentials' })
    })

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Invalid credentials' })
    })
  })

  describe('GET /api/auth/me', () => {
    let token: string

    beforeAll(async () => {
      // Create user and get token
      await AuthService.createUser('me@example.com', 'password123', 'Me User', 'TENANT')
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        })
      token = loginResponse.body.token
    })

    it('should return current user when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('me@example.com')
      expect(response.body.user.name).toBe('Me User')
      expect(response.body.user.role).toBe('TENANT')
    })

    it('should reject when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Not authenticated' })
    })

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Not authenticated' })
    })
  })

  describe('Role-based Access Control', () => {
    let adminToken: string
    let tenantToken: string

    beforeAll(async () => {
      // Create admin user
      await AuthService.createUser('admin@example.com', 'password123', 'Admin User', 'ADMIN')
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
      adminToken = adminLogin.body.token

      // Create tenant user
      await AuthService.createUser('tenant@example.com', 'password123', 'Tenant User', 'TENANT')
      const tenantLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@example.com',
          password: 'password123',
        })
      tenantToken = tenantLogin.body.token
    })

    it('should allow admin access with correct role', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'Admin access granted' })
    })

    it('should deny access with insufficient role', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${tenantToken}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({ error: 'Insufficient permissions' })
    })

    it('should deny access without authentication', async () => {
      const response = await request(app).get('/api/admin')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Not authenticated' })
    })
  })
})
