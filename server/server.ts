import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { AuthService, AuthUser } from './auth.js'
import { MockAuthService, mockUsers } from './mockAuth.js'
import { ChatService } from './chat.js'
import chatApi from './chat-api.js'
import paymentRoutes from './routes/payment.js'
import filesRouter from './controllers/filesController.js'
import dataGovernanceRouter from './controllers/dataGovernanceController.js'
import propertiesRoutes from './routes/properties.js'
import bookingsRoutes from './routes/bookings.js'
import reviewsRoutes from './routes/reviews.js'
import invoicesRoutes from './routes/invoices.js'
import adminRoutes from './routes/admin.js'
import imagekitRoutes from './routes/imagekit.js'
import imageController from './controllers/imageController.js'
import userRoutes from './routes/users.js'
import messagesRoutes from './routes/messages.js'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from './lib/supabaseServer.js'
import { PropertiesController } from './controllers/propertiesController.js'

// Client-side Supabase client (for public operations)
// const supabaseUrl = process.env.SUPABASE_URL || 'https://test.supabase.co'
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI0MzI0MCwiZXhwIjoxOTU4ODE5MjQwfQ.test'
// const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Use the server-side Supabase client instead
const supabase = supabaseServer

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3002 // 0 will let the OS assign an available port

// Initialize Socket.IO chat service
const chatService = new ChatService(server)

// CORS configuration with dynamic origin
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable or use defaults
    const frontendUrls = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176'];
    
    // Debug: Log CORS request
    console.log(`🔍 [CORS] Request from origin: ${origin}`);
    console.log(`🔍 [CORS] Allowed origins: ${frontendUrls.join(', ')}`);
    
    // Check if the origin is in our allowed list
    if (frontendUrls.indexOf(origin) !== -1) {
      console.log(`✅ [CORS] Allowing request from: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ [CORS] Blocking request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
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
    console.log('🔍 [Auth Middleware] No authorization header found')
    return next()
  }

  const token = authHeader.substring(7)
  console.log('🔍 [Auth Middleware] Token received (first 20 chars):', token.substring(0, 20) + '...')

  // Check if we should use mock authentication
  const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                     !process.env.SUPABASE_URL ||
                     !process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 [Auth Middleware] Using mock auth:', useMockAuth)

  try {
    const user = useMockAuth
      ? await MockAuthService.validateSession(token)
      : await AuthService.validateSession(token)

    if (user) {
      console.log('✅ [Auth Middleware] User authenticated:', user.email)
      req.currentUser = user
    } else {
      console.log('❌ [Auth Middleware] Token validation failed')
    }
  } catch (error) {
    console.error('❌ [Auth Middleware] Token validation error:', error)
  }

  next()
}

app.use(authMiddleware)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Welcome endpoint
app.get('/api/welcome', (req, res) => {
  console.log(`Request received: ${req.method} ${req.path}`)
  res.json({ message: 'Welcome to the StayEasy API!' })
})

// Mount API routes
app.use('/api', chatApi)
app.use('/api/payments', paymentRoutes)
app.use('/api/files', filesRouter)
app.use('/api', dataGovernanceRouter)
app.use('/api', propertiesRoutes)
app.use('/api', bookingsRoutes)
app.use('/api', reviewsRoutes)
app.use('/api', invoicesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/imagekit', imagekitRoutes)
app.use('/api/images', imageController)
app.use('/api/users', userRoutes)
app.use('/api/messages', messagesRoutes)

// Public properties endpoint (no auth required) - uses PropertiesController for proper filtering
app.get('/api/properties', PropertiesController.getProperties);

// Auth routes with fallback to mock authentication
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    
    // Check if we should use mock authentication
    // Use MOCK_AUTH=true in .env to force mock mode
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_URL === 'https://your-project.supabase.co' ||
                       process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key'
    
    // DIAGNOSTIC: Log environment status
    console.log('🔍 [Server] Environment Status Check:')
    console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    console.log('   - MOCK_AUTH:', process.env.MOCK_AUTH)
    console.log('   - Will use mock auth:', useMockAuth)
    
    console.log('🔍 Signup request received:', { email, name, role, useMockAuth })
    
    let user
    if (useMockAuth) {
      console.log('🔄 Using mock authentication for signup')
      user = await MockAuthService.createUser(email, password, name, role || 'TENANT')
      console.log('✅ Mock user created:', user)
      // Add the user to the shared mockUsers array so login can find it
      mockUsers.push(user)
    } else {
      console.log('🔐 Using real authentication for signup')
      user = await AuthService.createUser(email, password, name, role)
    }
    
    const { accessToken, refreshToken } = useMockAuth
      ? await MockAuthService.createSession(user)
      : await AuthService.createSession(user)
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'Signup successful'
    })
  } catch (error: any) {
    console.error('❌ Signup error:', error)
    res.status(400).json({
      success: false,
      error: { code: 'SIGNUP_FAILED', message: error.message || 'User creation failed' }
    })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Check if we should use mock authentication
    // Use MOCK_AUTH=true in .env to force mock mode
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 [Server] Login Environment Status Check:')
    console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    console.log('   - MOCK_AUTH:', process.env.MOCK_AUTH)
    console.log('   - Will use mock auth:', useMockAuth)
    
    console.log('🔍 Login request received:', { email, useMockAuth })
    
    let user
    if (useMockAuth) {
      console.log('🔄 Using mock authentication for login')
      user = await MockAuthService.authenticateUser(email, password)
      console.log('🔍 Mock auth result:', user)
    } else {
      console.log('🔐 Using real authentication for login')
      user = await AuthService.authenticateUser(email, password)
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const { accessToken, refreshToken } = useMockAuth
      ? await MockAuthService.createSession(user)
      : await AuthService.createSession(user)
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'Login successful'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: 'Login failed' }
    })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body
    const useMockAuth = !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_URL === 'https://your-project.supabase.co' ||
                       process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key'
    
    if (refreshToken && !useMockAuth) {
      await AuthService.logout(refreshToken)
    }
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' })
  }
})

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    const useMockAuth = !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_URL === 'https://your-project.supabase.co' ||
                       process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key'
    
    let newTokens
    if (useMockAuth) {
      newTokens = await MockAuthService.refreshToken(refreshToken)
    } else {
      newTokens = await AuthService.refreshToken(refreshToken)
    }
    
    if (!newTokens) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    res.json({ token: newTokens.accessToken, refreshToken: newTokens.refreshToken })
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params
    const useMockAuth = !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_URL === 'https://your-project.supabase.co' ||
                       process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key'
    
    if (useMockAuth) {
      // Mock authentication doesn't support email verification
      return res.status(400).json({ error: 'Email verification not available in mock mode' })
    }
    
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
  console.log('🔍 [Auth Me] Current user check:', {
    hasCurrentUser: !!req.currentUser,
    userEmail: req.currentUser?.email,
    userId: req.currentUser?.id,
    userRole: req.currentUser?.role
  })

  if (!req.currentUser) {
    console.log('❌ [Auth Me] No current user found, returning 401')
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' }
    })
  }

  console.log('✅ [Auth Me] User profile found, returning 200')
  res.json({
    success: true,
    data: {
      user: {
        id: req.currentUser.id,
        email: req.currentUser.email,
        name: req.currentUser.name,
        role: req.currentUser.role,
      }
    }
  })
})

// Update user role endpoint
app.patch('/api/auth/me/role', async (req, res) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' }
      })
    }

    const { role } = req.body;
    
    if (!role || !['TENANT', 'OWNER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid role specified' }
      })
    }

    // Check if we should use mock authentication
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY

    let updatedUser;
    
    if (useMockAuth) {
      // Update user in mock array
      const userIndex = mockUsers.findIndex(u => u.id === req.currentUser!.id);
      if (userIndex !== -1) {
        mockUsers[userIndex].role = role as 'TENANT' | 'OWNER' | 'ADMIN';
        updatedUser = mockUsers[userIndex];
      } else {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        })
      }
    } else {
      // Update user in Supabase
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', req.currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({
          success: false,
          error: { code: 'ROLE_UPDATE_FAILED', message: 'Failed to update user role' }
        })
      }

      updatedUser = data;
    }

    console.log(`✅ User role updated: ${req.currentUser.email} -> ${role}`);

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        }
      },
      message: `Role successfully updated to ${role}`
    })

  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    })
  }
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
  console.error('❌ [Server Error]:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  })
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }
  })
})

// 404 handler
app.use((req, res) => {
  console.log(`❌ [404] Route not found: ${req.method} ${req.url}`)
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 StayEasy API Server running on port ${PORT}`)
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`)
  console.log(`💬 WebSocket chat service initialized`)
  console.log(`🔧 CORS configured for origins: ${process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5176'}`)
})

// Handle EADDRINUSE error
server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`)
    console.error(`💡 Please terminate the existing process or use a different port.`)
    console.error(`   On Windows, you can use the following commands in a new terminal:`)
    console.error(`   netstat -ano | findstr :${PORT} (to find the PID)`)
    console.error(`   taskkill /PID <PID> /F (to terminate the process)`)
    process.exit(1)
  } else {
    console.error(e)
    process.exit(1)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})

export default app
