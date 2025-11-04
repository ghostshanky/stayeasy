import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { BookingsController } from '../controllers/bookingsController.js'
import rateLimit from 'express-rate-limit'

const bookingsRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// Tenant routes
bookingsRoutes.post(
  '/tenant/bookings',
  bookingLimiter,
  requireAuth,
  requireRole(['TENANT']),
  BookingsController.createBooking
)

bookingsRoutes.put(
  '/tenant/bookings/:id',
  bookingLimiter,
  requireAuth,
  requireRole(['TENANT']),
  BookingsController.updateBooking
)

bookingsRoutes.delete(
  '/tenant/bookings/:id',
  bookingLimiter,
  requireAuth,
  requireRole(['TENANT']),
  BookingsController.cancelBooking
)

bookingsRoutes.get(
  '/tenant/bookings',
  requireAuth,
  requireRole(['TENANT']),
  BookingsController.getTenantBookings
)

bookingsRoutes.get(
  '/tenant/bookings/:id',
  requireAuth,
  requireRole(['TENANT']),
  BookingsController.getBookingDetails
)

// Owner routes
bookingsRoutes.get(
  '/owner/bookings',
  requireAuth,
  requireRole(['OWNER']),
  BookingsController.getOwnerBookings
)

bookingsRoutes.put(
  '/owner/bookings/:id/status',
  bookingLimiter,
  requireAuth,
  requireRole(['OWNER']),
  BookingsController.updateBookingStatus
)

export default bookingsRoutes
