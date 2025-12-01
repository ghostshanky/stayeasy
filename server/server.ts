
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'PORT'
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '))
  console.error('Please check your .env file')
  process.exit(1)
}

const app = express()
const server = createServer(app)
const PORT = parseInt(process.env.PORT || '3002')


// Global request logging
app.use((req, _res, next) => {
  console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Auth middleware
declare global {
  namespace Express {
    interface Request {
      currentUser?: import('./auth.js').AuthUser
    }
  }
}

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Authorization token required' }
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.validateSession(token)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      })
    }

    req.currentUser = user
    next()
  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication failed' }
    })
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Public routes - using real PropertiesController with Supabase data
app.get('/api/properties', PropertiesController.getProperties)
app.get('/api/properties/:id', PropertiesController.getPropertyDetails)

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email, password, and name are required' }
      })
    }

    const user = await AuthService.createUser(email, password, name, role)
    const { accessToken, refreshToken } = await AuthService.createSession(user)

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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' }
      })
    }

    const user = await AuthService.authenticateUser(email, password)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const { accessToken, refreshToken } = await AuthService.createSession(user)

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
    console.error('❌ Login error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: 'Login failed' }
    })
  }
})

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await AuthService.logout(refreshToken)
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('❌ Logout error:', error)
    res.status(500).json({ success: false, error: 'Logout failed' })
  }
})

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' }
      })
    }

    const newTokens = await AuthService.refreshToken(refreshToken)
    if (!newTokens) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
      })
    }

    res.json({
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    })
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'TOKEN_REFRESH_FAILED', message: 'Token refresh failed' }
    })
  }
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.currentUser!.id,
        email: req.currentUser!.email,
        name: req.currentUser!.name,
        role: req.currentUser!.role,
      }
    }
  })
})

reviewsRouter.get('/', ReviewsController.getReviews)
reviewsRouter.get('/:id', ReviewsController.getReviewDetails)
reviewsRouter.put('/:id', ReviewsController.updateReview)
reviewsRouter.delete('/:id', ReviewsController.deleteReview)

const paymentsRouter = express.Router()
paymentsRouter.post('/create', PaymentsController.createPayment)
paymentsRouter.post('/confirm', PaymentsController.confirmPayment)
paymentsRouter.get('/pending', PaymentsController.getPendingPayments)
paymentsRouter.post('/verify', PaymentsController.verifyPayment)
paymentsRouter.post('/webhook', PaymentsController.handleWebhook)


const adminRouter = express.Router()
adminRouter.get('/stats', AdminController.getStats)
adminRouter.get('/users', AdminController.getUsers)
adminRouter.get('/users/:id', AdminController.getUserDetails)
adminRouter.put('/users/:id', AdminController.updateUser)
adminRouter.delete('/users/:id', AdminController.deleteUser)
adminRouter.get('/audit-logs', AdminController.getAuditLogs)
adminRouter.delete('/content/:type/:id', AdminController.removeContent)

app.use('/api/bookings', bookingsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/admin', adminRouter)

// File upload routes
app.post('/api/upload', authMiddleware, (_req, res) => {
  res.json({ success: true, message: 'File upload endpoint - to be implemented' })
})

app.post('/api/images/upload-profile', authMiddleware, (req, res) => {
  try {
    // In a real implementation, this would handle file upload to Cloudinary or ImageKit
    // For now, return a success response with mock data
    res.json({
      success: true,
      data: {
        url: 'https://via.placeholder.com/150',
        filename: 'profile.jpg',
        size: 1024,
        mimetype: 'image/jpeg'
      },
      message: 'Profile image uploaded successfully'
    })
  } catch (error) {
    console.error('❌ Profile image upload error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload profile image' }
    })
  }
})

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ [Server Error]:', {
    error: error.message,
    stack: error.stack,
    url: (_req as any).url,
    method: (_req as any).method,
    userId: (_req as any).currentUser?.id
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
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 StayEasy API Server running on port ${PORT}`)
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`)
  console.log(`💬 WebSocket chat service initialized`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('uncaughtException', (error) => {
  console.error('❌ [Uncaught Exception]', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('❌ [Unhandled Rejection]', reason)
  process.exit(1)
})

export default app
