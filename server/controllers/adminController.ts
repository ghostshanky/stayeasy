import { Request, Response } from 'express'
import { z } from 'zod'
import { AuditLogger } from '../audit-logger.js'
import { supabaseServer } from '../lib/supabaseServer.js'

// --- Input Validation Schemas ---
const userQuerySchema = z.object({
  role: z.enum(['TENANT', 'OWNER', 'ADMIN']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['TENANT', 'OWNER', 'ADMIN']).optional(),
  emailVerified: z.boolean().optional(),
  isActive: z.boolean().optional()
})

const auditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export class AdminController {
  /**
   * GET /api/admin/users
   * Returns a paginated list of all users (admin only)
   */
  static async getUsers(req: Request, res: Response) {
    try {
      const validation = userQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const { role, page, limit } = validation.data

      const where: any = {}
      if (role) where.role = role

      // Build query for users
      let query = supabaseServer
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          email_verified,
          created_at,
          updated_at
        `)

      if (role) {
        query = query.eq('role', role)
      }

      // Get total count
      let countQuery = supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (role) {
        countQuery = countQuery.eq('role', role)
      }

      const { count: total, error: countError } = await countQuery

      if (countError) {
        throw new Error(`Failed to count users: ${countError.message}`)
      }

      // Get users with pagination
      const { data: usersData, error } = await query
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`)
      }

      // Get counts for each user
      const usersWithCounts = await Promise.all(
        (usersData || []).map(async (user: any) => {
          const [propertiesCount, bookingsCount, reviewsCount] = await Promise.all([
            supabaseServer.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
            supabaseServer.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabaseServer.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
          ])

          return {
            ...user,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            _count: {
              properties: propertiesCount.count || 0,
              bookings: bookingsCount.count || 0,
              reviews: reviewsCount.count || 0
            }
          }
        })
      )

      const users = usersWithCounts

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil((total || 0) / limit)
        }
      })
    } catch (error: any) {
      console.error('Users fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users.' }
      })
    }
  }

  /**
   * GET /api/admin/users/:id
   * Returns detailed information about a specific user (admin only)
   */
  static async getUserDetails(req: Request, res: Response) {
    try {
      const userId = req.params.id

      // Get user basic info
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
          })
        }
        throw new Error(`Failed to fetch user: ${userError.message}`)
      }

      // Get user's properties with counts
      const { data: properties, error: propertiesError } = await supabaseServer
        .from('properties')
        .select(`
          id,
          name,
          address,
          created_at
        `)
        .eq('owner_id', userId)

      if (propertiesError) {
        throw new Error(`Failed to fetch properties: ${propertiesError.message}`)
      }

      // Add counts to properties
      const propertiesWithCounts = await Promise.all(
        (properties || []).map(async (property: any) => {
          const [bookingsCount, reviewsCount] = await Promise.all([
            supabaseServer.from('bookings').select('*', { count: 'exact', head: true }).eq('property_id', property.id),
            supabaseServer.from('reviews').select('*', { count: 'exact', head: true }).eq('property_id', property.id)
          ])

          return {
            ...property,
            createdAt: property.created_at,
            _count: {
              bookings: bookingsCount.count || 0,
              reviews: reviewsCount.count || 0
            }
          }
        })
      )

      // Get user's bookings (last 10)
      const { data: bookings, error: bookingsError } = await supabaseServer
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          status,
          created_at,
          properties (
            name,
            address
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`)
      }

      // Get user's reviews (last 10)
      const { data: reviews, error: reviewsError } = await supabaseServer
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          properties (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (reviewsError) {
        throw new Error(`Failed to fetch reviews: ${reviewsError.message}`)
      }

      const userDetails = {
        ...user,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        properties: propertiesWithCounts,
        bookings: (bookings || []).map((booking: any) => ({
          ...booking,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          createdAt: booking.created_at,
          property: booking.properties
        })),
        reviews: (reviews || []).map((review: any) => ({
          ...review,
          createdAt: review.created_at,
          property: review.properties
        }))
      }

      res.status(200).json({
        success: true,
        data: userDetails
      })
    } catch (error: any) {
      console.error('User details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user details.' }
      })
    }
  }

  /**
   * PUT /api/admin/users/:id
   * Updates a user (admin only)
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const validation = userUpdateSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const adminId = req.currentUser!.id
      const userId = req.params.id
      const updates = validation.data

      // Prepare update data for Supabase
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.email !== undefined) updateData.email = updates.email
      if (updates.role !== undefined) updateData.role = updates.role
      if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      updateData.updated_at = new Date().toISOString()

      const { data: user, error } = await supabaseServer
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, name, role, email_verified, created_at, updated_at')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
          })
        }
        throw new Error(`Failed to update user: ${error.message}`)
      }

      // Log audit event
      await AuditLogger.logUserAction(adminId, 'USER_UPDATED', `User ${userId} updated: ${JSON.stringify(updates)}`)

      res.status(200).json({
        success: true,
        data: {
          ...user,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      })
    } catch (error: any) {
      console.error('User update error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update user.' }
      })
    }
  }

  /**
   * DELETE /api/admin/users/:id
   * Deactivates a user account (admin only)
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const adminId = req.currentUser!.id
      const userId = req.params.id

      // Check if user exists
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
          })
        }
        throw new Error(`Failed to fetch user: ${userError.message}`)
      }

      // Instead of hard delete, we could mark as inactive
      // For now, we'll do a soft delete by updating a flag
      // Assuming we add an is_active field to users table
      const { error: updateError } = await supabaseServer
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        throw new Error(`Failed to deactivate user: ${updateError.message}`)
      }

      // Log audit event
      await AuditLogger.logUserAction(adminId, 'USER_DELETED', `User ${userId} (${user.email}) deleted`)

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error: any) {
      console.error('User deletion error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user.' }
      })
    }
  }

  /**
   * DELETE /api/admin/content/:type/:id
   * Removes inappropriate content (admin only)
   */
  static async removeContent(req: Request, res: Response) {
    try {
      const adminId = req.currentUser!.id
      const { type, id } = req.params

      let error: any
      if (type === 'review') {
        ({ error } = await supabaseServer.from('reviews').delete().eq('id', id))
        if (!error) await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Review ${id} removed`)
      } else if (type === 'property') {
        ({ error } = await supabaseServer.from('properties').delete().eq('id', id))
        if (!error) await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Property ${id} removed`)
      } else if (type === 'message') {
        ({ error } = await supabaseServer.from('messages').delete().eq('id', id))
        if (!error) await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Message ${id} removed`)
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid content type. Must be review, property, or message.' }
        })
      }

      if (error) {
        throw new Error(`Failed to remove ${type}: ${error.message}`)
      }

      res.status(200).json({
        success: true,
        message: `${type} removed successfully`
      })
    } catch (error: any) {
      console.error('Content removal error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to remove content.' }
      })
    }
  }

  /**
   * GET /api/admin/audit-logs
   * Returns audit logs (admin only)
   */
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const validation = auditQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const { userId, action, page, limit } = validation.data

      // Build query for logs
      let logsQuery = supabaseServer
        .from('audit_logs')
        .select(`
          *,
          actor:users!audit_logs_user_id_fkey (
            id,
            name,
            email,
            role
          )
        `)

      if (userId) {
        logsQuery = logsQuery.eq('user_id', userId)
      }
      if (action) {
        logsQuery = logsQuery.eq('action', action)
      }

      const { data: logs, error: logsError } = await logsQuery
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      if (logsError) {
        throw new Error(`Failed to fetch audit logs: ${logsError.message}`)
      }

      // Get total count
      let countQuery = supabaseServer
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      if (userId) {
        countQuery = countQuery.eq('user_id', userId)
      }
      if (action) {
        countQuery = countQuery.eq('action', action)
      }

      const { count: total, error: countError } = await countQuery

      if (countError) {
        throw new Error(`Failed to count audit logs: ${countError.message}`)
      }

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil((total || 0) / limit)
        }
      })
    } catch (error: any) {
      console.error('Audit logs fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs.' }
      })
    }
  }

  /**
   * GET /api/admin/stats
   * Returns system statistics (admin only)
   */
  static async getStats(req: Request, res: Response) {
    try {
      // Get user stats by role
      const { data: userRoleStats, error: userError } = await supabaseServer
        .from('users')
        .select('role')

      if (userError) {
        throw new Error(`Failed to fetch user stats: ${userError.message}`)
      }

      const byRole = (userRoleStats || []).reduce((acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})

      // Get total users
      const { count: totalUsers, error: totalUsersError } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (totalUsersError) {
        throw new Error(`Failed to count users: ${totalUsersError.message}`)
      }

      // Get total properties
      const { count: totalProperties, error: propertiesError } = await supabaseServer
        .from('properties')
        .select('*', { count: 'exact', head: true })

      if (propertiesError) {
        throw new Error(`Failed to count properties: ${propertiesError.message}`)
      }

      // Get booking stats by status
      const { data: bookingStatusStats, error: bookingError } = await supabaseServer
        .from('bookings')
        .select('status')

      if (bookingError) {
        throw new Error(`Failed to fetch booking stats: ${bookingError.message}`)
      }

      const byStatusBookings = (bookingStatusStats || []).reduce((acc: Record<string, number>, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1
        return acc
      }, {})

      // Get total bookings
      const { count: totalBookings, error: totalBookingsError } = await supabaseServer
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      if (totalBookingsError) {
        throw new Error(`Failed to count bookings: ${totalBookingsError.message}`)
      }

      // Get payment stats
      const { data: paymentStats, error: paymentError } = await supabaseServer
        .from('payments')
        .select('status, amount')

      if (paymentError) {
        throw new Error(`Failed to fetch payment stats: ${paymentError.message}`)
      }

      const byStatusPayments = (paymentStats || []).reduce((acc: Record<string, number>, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1
        return acc
      }, {})

      const totalPayments = paymentStats?.length || 0
      const totalAmount = (paymentStats || []).reduce((sum, payment) => sum + (payment.amount || 0), 0)

      // Get review stats
      const { count: totalReviews, error: reviewsCountError } = await supabaseServer
        .from('reviews')
        .select('*', { count: 'exact', head: true })

      if (reviewsCountError) {
        throw new Error(`Failed to count reviews: ${reviewsCountError.message}`)
      }

      // Get average rating
      const { data: ratings, error: ratingsError } = await supabaseServer
        .from('reviews')
        .select('rating')

      if (ratingsError) {
        throw new Error(`Failed to fetch ratings: ${ratingsError.message}`)
      }

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, review) => sum + (review.rating || 0), 0) / ratings.length
        : null

      const stats = {
        users: {
          total: totalUsers || 0,
          byRole
        },
        properties: {
          total: totalProperties || 0
        },
        bookings: {
          total: totalBookings || 0,
          byStatus: byStatusBookings
        },
        payments: {
          total: totalPayments,
          totalAmount,
          byStatus: byStatusPayments
        },
        reviews: {
          total: totalReviews || 0,
          averageRating
        }
      }

      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      console.error('Stats fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch statistics.' }
      })
    }
  }
}
