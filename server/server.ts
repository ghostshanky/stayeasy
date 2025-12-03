import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { AuthService } from './auth.js'
import { PrismaClient } from '@prisma/client'

import { PaymentsController } from './controllers/paymentsController.js'
import messagesRouter from './controllers/messagesController.js'
import { AdminController } from './controllers/adminController.js'
import bookingsRouter from './routes/bookings.js'
import reviewsRouter from './routes/reviews.js'
import propertiesRoutes from './routes/properties.js'
import usersRouter from './routes/users.js'
import { ChatService } from './chat.js'

import multer from 'multer'
// import { supabaseServer } from './lib/supabaseServer.js'

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

// Initialize Chat Service
const chatService = new ChatService(server)

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

import authRouter from './routes/auth.js'

// Auth routes
app.use('/api/auth', authRouter)

// User routes (must be registered before admin routes to avoid conflicts)
app.use('/api/users', usersRouter)

const paymentsRouter = express.Router()
paymentsRouter.post('/create', PaymentsController.createPayment)
paymentsRouter.post('/confirm', PaymentsController.confirmPayment)
paymentsRouter.get('/pending', PaymentsController.getPendingPayments)
paymentsRouter.get('/', PaymentsController.getUserPayments) // Add this for user payments
paymentsRouter.get('/owner/:ownerId', PaymentsController.getOwnerPayments) // Add this for owner payments
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

app.use('/api', propertiesRoutes)
app.use('/api/bookings', bookingsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/payments', authMiddleware, paymentsRouter)
app.use('/api/messages', authMiddleware, messagesRouter)
app.use('/api/admin', adminRouter)

// File upload routes
app.post('/api/upload', authMiddleware, (_req, res) => {
  res.json({ success: true, message: 'File upload endpoint - to be implemented' })
})

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ [Server Error] Message:', error.message);
  console.error('❌ [Server Error] Stack:', error.stack);
  console.error('❌ [Server Error] Context:', {
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
