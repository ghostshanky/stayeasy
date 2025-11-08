import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { AdminController } from '../controllers/adminController.js'
import rateLimit from 'express-rate-limit'

const adminRoutes = express.Router()

// Apply rate limiting to sensitive admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// All admin routes require authentication and ADMIN role
adminRoutes.use(requireAuth)
adminRoutes.use(requireRole(['ADMIN']))

// User management routes
adminRoutes.get('/users', adminLimiter, AdminController.getUsers)
adminRoutes.get('/users/:id', adminLimiter, AdminController.getUserDetails)
adminRoutes.put('/users/:id', adminLimiter, AdminController.updateUser)
adminRoutes.delete('/users/:id', adminLimiter, AdminController.deleteUser)

// Content moderation routes
adminRoutes.delete('/content/:type/:id', adminLimiter, AdminController.removeContent)

// Audit logs route
adminRoutes.get('/audit-logs', adminLimiter, AdminController.getAuditLogs)

// System statistics route
adminRoutes.get('/stats', adminLimiter, AdminController.getStats)

export default adminRoutes
