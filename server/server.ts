import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { AuthService, AuthUser } from './auth.js'
import { ChatService } from './chat.js'
import chatApi from './chat-api.js'
import paymentRoutes from './controllers/paymentsController.js'
import filesRouter from './controllers/filesController.js'
import dataGovernanceRouter from './controllers/dataGovernanceController.js'

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Initialize Socket.IO chat service
const chatService = new ChatService(server)

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Middleware to inject currentUser
declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthUser
    }
  }
}

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)
  const user = await AuthService.validateSession(token)
  if (user) {
    req.currentUser = user
  }
  next()
}

app.use(authMiddleware)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount API routes
app.use('/api', chatApi)
app.use('/api/payments', paymentRoutes)
app.use('/api/files', filesRouter)
app.use('/api', dataGovernanceRouter)

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    const user = await AuthService.createUser(email, password, name, role)
    res.json({ message: 'User created successfully. Please check your email for verification.', userId: user.id })
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

app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      await AuthService.invalidateSession(token)
    }
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' })
  }
})

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    const payload = AuthService.verifyRefreshToken(refreshToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await AuthService.getUserById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const newToken = AuthService.generateToken(user)
    const newRefreshToken = AuthService.generateRefreshToken(user)

    res.json({ token: newToken, refreshToken: newRefreshToken })
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params
    const success = await AuthService.verifyEmailToken(token)
    if (success) {
      res.json({ message: 'Email verified successfully' })
    } else {
      res.status(400).json({ error: 'Invalid or expired token' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Email verification failed' })
  }
})

app.get('/api/auth/me', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  res.json({ user: req.currentUser })
})

// Protected route example
app.get('/api/protected', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  res.json({ message: 'This is a protected route', user: req.currentUser })
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error)
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket chat service initialized`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})

export default app
