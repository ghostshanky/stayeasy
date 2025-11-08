import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { AuthService, AuthUser } from './auth.js'
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
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from './lib/supabaseServer.js'

// Client-side Supabase client (for public operations)
const supabaseUrl = process.env.SUPABASE_URL || 'https://test.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI0MzI0MCwiZXhwIjoxOTU4ODE5MjQwfQ.test'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3002

// Initialize Socket.IO chat service
const chatService = new ChatService(server)

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
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

// Public properties endpoint (no auth required)
app.get('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        address,
        price,
        available,
        description,
        files!inner(url),
        reviews(rating)
      `)
      .eq('available', true)
      .limit(20);

    if (error) {
      console.error('Error fetching properties:', error);
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

    // Calculate average ratings and map to response format
    const properties = data.map((property: any) => {
      const reviews = property.reviews || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        id: property.id,
        name: property.name,
        location: property.address,
        price: `₹${property.price.toLocaleString()}`,
        priceValue: property.price,
        rating: Math.round(averageRating * 10) / 10,
        imageUrl: property.files?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image',
        status: property.available ? 'Listed' : 'Unlisted',
        details: property.description || 'No description available'
      };
    });

    res.json(properties);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    const user = await AuthService.createUser(email, password, name, role)
    res.json({ message: 'User created successfully. Please check your email for verification.', userId: user.id })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'User creation failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await AuthService.authenticateUser(email, password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const { accessToken, refreshToken } = await AuthService.createSession(user)
    res.json({ token: accessToken, refreshToken, user })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
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
    const newTokens = await AuthService.refreshToken(refreshToken)
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
