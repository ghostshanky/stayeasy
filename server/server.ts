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
import userRoutes from './routes/users.js'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from './lib/supabaseServer.js'

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
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
    
    // Check if the origin is in our allowed list
    if (frontendUrls.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
    return next()
  }

  const token = authHeader.substring(7)

  // Check if we should use mock authentication
  const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                     !process.env.SUPABASE_URL ||
                     !process.env.SUPABASE_SERVICE_ROLE_KEY

  const user = useMockAuth
    ? await MockAuthService.validateSession(token)
    : await AuthService.validateSession(token)

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
app.use('/api/users', userRoutes)

// Public properties endpoint (no auth required)
app.get('/api/properties', async (req, res) => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('available', true)
      .limit(20);

    if (error || !data) {
      console.error('Error fetching properties from Supabase:', error);
      // Fallback to mock data if database access fails
      const mockProperties = [
        {
          id: '1',
          name: 'Cozy Shared Room near University',
          location: 'Koramangala, Bangalore',
          price: '₹8,500',
          priceValue: 8500,
          rating: 4.8,
          imageUrl: 'https://via.placeholder.com/400x300?text=Property+1',
          status: 'Listed',
          details: 'Shared room with high-speed internet, 24/7 security, and access to common areas. Perfect for students and young professionals.',
          owner: { name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: '2',
          name: 'Modern PG for Professionals',
          location: 'Hiranandani, Mumbai',
          price: '₹15,000',
          priceValue: 15000,
          rating: 4.5,
          imageUrl: 'https://via.placeholder.com/400x300?text=Property+2',
          status: 'Listed',
          details: 'Private room in a modern PG with gym, swimming pool, and cafeteria. Ideal for working professionals.',
          owner: { name: 'Jane Smith', email: 'jane@example.com' }
        },
        {
          id: '3',
          name: 'Student Hub Downtown',
          location: 'FC Road, Pune',
          price: '₹7,200',
          priceValue: 7200,
          rating: 4.6,
          imageUrl: 'https://via.placeholder.com/400x300?text=Property+3',
          status: 'Listed',
          details: 'Student-friendly accommodation with study areas, laundry facilities, and mess service.',
          owner: { name: 'Raj Patel', email: 'raj@example.com' }
        },
        {
          id: '4',
          name: 'The Executive Stay',
          location: 'Cyber City, Gurgaon',
          price: '₹22,500',
          priceValue: 22500,
          rating: 4.9,
          imageUrl: 'https://via.placeholder.com/400x300?text=Property+4',
          status: 'Listed',
          details: 'Luxury private room with premium amenities, concierge service, and access to business center.',
          owner: { name: 'Sarah Johnson', email: 'sarah@example.com' }
        }
      ];
      
      return res.json(mockProperties);
    }

    // If database query succeeds, process the data
    const properties = data.map((property: any) => ({
      id: property.id,
      name: property.name,
      location: property.address,
      price: `₹${property.price?.toLocaleString() || '0'}`,
      priceValue: property.price || 0,
      rating: 0, // Skip reviews for now
      imageUrl: 'https://via.placeholder.com/400x300?text=No+Image',
      status: property.available ? 'Listed' : 'Unlisted',
      details: property.description || 'No description available',
      owner: property.owner
    }));

    res.json(properties);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    // Return mock data as fallback
    const fallbackProperties = [
      {
        id: '1',
        name: 'Cozy Shared Room near University',
        location: 'Koramangala, Bangalore',
        price: '₹8,500',
        priceValue: 8500,
        rating: 4.8,
        imageUrl: 'https://via.placeholder.com/400x300?text=Property+1',
        status: 'Listed',
        details: 'Shared room with high-speed internet, 24/7 security, and access to common areas. Perfect for students and young professionals.',
        owner: { name: 'John Doe', email: 'john@example.com' }
      },
      {
        id: '2',
        name: 'Modern PG for Professionals',
        location: 'Hiranandani, Mumbai',
        price: '₹15,000',
        priceValue: 15000,
        rating: 4.5,
        imageUrl: 'https://via.placeholder.com/400x300?text=Property+2',
        status: 'Listed',
        details: 'Private room in a modern PG with gym, swimming pool, and cafeteria. Ideal for working professionals.',
        owner: { name: 'Jane Smith', email: 'jane@example.com' }
      }
    ];
    
    res.json(fallbackProperties);
  }
});

// Auth routes with fallback to mock authentication
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    
    // Check if we should use mock authentication
    // Use MOCK_AUTH=true in .env to force mock mode
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY
    
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
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Not authenticated' }
    })
  }
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
  console.log(`🚀 StayEasy API Server running on port ${PORT}`)
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`)
  console.log(`💬 WebSocket chat service initialized`)
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
