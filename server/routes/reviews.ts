import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { ReviewsController } from '../controllers/reviewsController.js'
import rateLimit from 'express-rate-limit'

const reviewsRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// Tenant routes
reviewsRoutes.post(
  '/tenant/reviews',
  reviewLimiter,
  requireAuth,
  requireRole(['TENANT']),
  ReviewsController.createReview
)

reviewsRoutes.put(
  '/tenant/reviews/:id',
  reviewLimiter,
  requireAuth,
  requireRole(['TENANT']),
  ReviewsController.updateReview
)

reviewsRoutes.delete(
  '/tenant/reviews/:id',
  reviewLimiter,
  requireAuth,
  requireRole(['TENANT']),
  ReviewsController.deleteReview
)

// Public routes
reviewsRoutes.get(
  '/reviews',
  ReviewsController.getReviews
)

reviewsRoutes.get(
  '/reviews/:id',
  ReviewsController.getReviewDetails
)

// Admin routes
reviewsRoutes.put(
  '/admin/reviews/:id/moderate',
  reviewLimiter,
  requireAuth,
  requireRole(['ADMIN']),
  ReviewsController.moderateReview
)

export default reviewsRoutes
