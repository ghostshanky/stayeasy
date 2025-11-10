import { Request, Response } from 'express'
import { z } from 'zod'
import { AuditLogger } from '../audit-logger.js'
import { supabaseServer } from '../lib/supabaseServer.js'

// --- Input Validation Schemas ---
const createReviewSchema = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
})

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional()
})

const reviewQuerySchema = z.object({
  propertyId: z.string().optional(),
  userId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export class ReviewsController {
  /**
   * POST /api/tenant/reviews
   * Creates a new review for a property by the authenticated tenant
   */
  static async createReview(req: Request, res: Response) {
    try {
      const validation = createReviewSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const { propertyId, rating, comment } = validation.data

      // Check if tenant has a completed booking for this property
      const { data: completedBooking, error: bookingError } = await supabaseServer
        .from('bookings')
        .select('id')
        .eq('user_id', tenantId)
        .eq('property_id', propertyId)
        .eq('status', 'COMPLETED')
        .single()

      if (bookingError && bookingError.code !== 'PGRST116') {
        throw bookingError
      }

      if (!completedBooking) {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You can only review properties you have completed bookings for.' }
        })
      }

      // Check if review already exists
      const { data: existingReview, error: reviewError } = await supabaseServer
        .from('reviews')
        .select('id')
        .eq('user_id', tenantId)
        .eq('property_id', propertyId)
        .single()

      if (reviewError && reviewError.code !== 'PGRST116') {
        throw reviewError
      }

      if (existingReview) {
        return res.status(409).json({
          success: false,
          error: { code: 'REVIEW_EXISTS', message: 'You have already reviewed this property.' }
        })
      }

      const { data: review, error: createError } = await supabaseServer
        .from('reviews')
        .insert({
          user_id: tenantId,
          property_id: propertyId,
          rating,
          comment
        })
        .select(`
          *,
          user:users!user_id (name),
          property:properties!property_id (name)
        `)
        .single()

      if (createError) {
        throw createError
      }

      // Log audit event
      await AuditLogger.logReviewCreation(tenantId, review.id, rating)

      res.status(201).json({
        success: true,
        data: review
      })
    } catch (error: any) {
      console.error('Review creation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create review.' }
      })
    }
  }

  /**
   * PUT /api/tenant/reviews/:id
   * Updates an existing review owned by the authenticated tenant
   */
  static async updateReview(req: Request, res: Response) {
    try {
      const validation = updateReviewSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const reviewId = req.params.id
      const updates = validation.data

      const { data: review, error: updateError } = await supabaseServer
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .eq('user_id', tenantId)
        .select(`
          *,
          user:users!user_id (name),
          property:properties!property_id (name)
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      // Log audit event
      await AuditLogger.logReviewUpdate(tenantId, review.propertyId, reviewId, updates)

      res.status(200).json({
        success: true,
        data: review
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found or you do not own it.' }
        })
      }
      console.error('Review update error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update review.' }
      })
    }
  }

  /**
   * DELETE /api/tenant/reviews/:id
   * Deletes a review owned by the authenticated tenant
   */
  static async deleteReview(req: Request, res: Response) {
    try {
      const tenantId = req.currentUser!.id
      const reviewId = req.params.id

      const { data: review, error: findError } = await supabaseServer
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', tenantId)
        .single()

      if (findError || !review) {
        return res.status(404).json({
          success: false,
          error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found or you do not own it.' }
        })
      }

      const { error: deleteError } = await supabaseServer
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (deleteError) {
        throw deleteError
      }

      // Log audit event
      await AuditLogger.logReviewDeletion(tenantId, review.propertyId, reviewId)

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      })
    } catch (error: any) {
      console.error('Review deletion error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review.' }
      })
    }
  }

  /**
   * GET /api/reviews
   * Returns a paginated list of reviews (public endpoint)
   */
  static async getReviews(req: Request, res: Response) {
    try {
      const validation = reviewQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const { propertyId, userId, page, limit } = validation.data

      const where: any = {}
      if (propertyId) where.propertyId = propertyId
      if (userId) where.userId = userId

      // Build query for reviews
      let query = supabaseServer
        .from('reviews')
        .select(`
          *,
          user:users!user_id (name),
          property:properties!property_id (name)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: reviews, error: reviewsError } = await query
      if (reviewsError) {
        throw reviewsError
      }

      // Get total count
      let countQuery = supabaseServer
        .from('reviews')
        .select('*', { count: 'exact', head: true })

      if (propertyId) {
        countQuery = countQuery.eq('property_id', propertyId)
      }
      if (userId) {
        countQuery = countQuery.eq('user_id', userId)
      }

      const { count: total, error: countError } = await countQuery
      if (countError) {
        throw countError
      }

      res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil((total || 0) / limit)
        }
      })
    } catch (error: any) {
      console.error('Reviews fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews.' }
      })
    }
  }

  /**
   * GET /api/reviews/:id
   * Returns detailed information about a specific review
   */
  static async getReviewDetails(req: Request, res: Response) {
    try {
      const reviewId = req.params.id

      const { data: review, error: reviewError } = await supabaseServer
        .from('reviews')
        .select(`
          *,
          user:users!user_id (name, email),
          property:properties!property_id (name, address)
        `)
        .eq('id', reviewId)
        .single()

      if (reviewError || !review) {
        return res.status(404).json({
          success: false,
          error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found.' }
        })
      }

      res.status(200).json({
        success: true,
        data: review
      })
    } catch (error: any) {
      console.error('Review details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch review details.' }
      })
    }
  }

  /**
   * PUT /api/admin/reviews/:id/moderate
   * Moderates a review (admin only)
   */
  static async moderateReview(req: Request, res: Response) {
    try {
      const adminId = req.currentUser!.id
      const reviewId = req.params.id
      const { action, reason } = req.body

      if (!['APPROVE', 'HIDE', 'DELETE'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ACTION', message: 'Action must be APPROVE, HIDE, or DELETE.' }
        })
      }

      const { data: review, error: reviewError } = await supabaseServer
        .from('reviews')
        .select(`
          *,
          property:properties!property_id (*)
        `)
        .eq('id', reviewId)
        .single()

      if (reviewError || !review) {
        return res.status(404).json({
          success: false,
          error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found.' }
        })
      }

      let result
      if (action === 'DELETE') {
        const { error: deleteError } = await supabaseServer
          .from('reviews')
          .delete()
          .eq('id', reviewId)

        if (deleteError) {
          throw deleteError
        }
        result = review
      } else {
        // For APPROVE/HIDE, we could add a moderation status field
        // For now, just log the action
        result = review
      }

      // Log audit event
      await AuditLogger.logReviewModeration(adminId, reviewId, action, reason)

      res.status(200).json({
        success: true,
        data: result,
        message: `Review ${action.toLowerCase()}d successfully`
      })
    } catch (error: any) {
      console.error('Review moderation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to moderate review.' }
      })
    }
  }
}
