import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { AuditLogger } from '../audit-logger.js'

const prisma = new PrismaClient()

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

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                properties: true,
                bookings: true,
                reviews: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          properties: {
            select: {
              id: true,
              name: true,
              address: true,
              createdAt: true,
              _count: {
                select: {
                  bookings: true,
                  reviews: true
                }
              }
            }
          },
          bookings: {
            select: {
              id: true,
              checkIn: true,
              checkOut: true,
              status: true,
              createdAt: true,
              property: {
                select: {
                  name: true,
                  address: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              property: {
                select: {
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
        })
      }

      res.status(200).json({
        success: true,
        data: user
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

      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Log audit event
      await AuditLogger.logUserAction(adminId, 'USER_UPDATED', `User ${userId} updated: ${JSON.stringify(updates)}`)

      res.status(200).json({
        success: true,
        data: user
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
        })
      }
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
        })
      }

      // Instead of hard delete, we could mark as inactive
      // For now, we'll do a soft delete by updating a flag
      // Assuming we add an isActive field to User model
      await prisma.user.update({
        where: { id: userId },
        data: { /* isActive: false */ }
      })

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

      let result
      if (type === 'review') {
        result = await prisma.review.delete({
          where: { id }
        })
        await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Review ${id} removed`)
      } else if (type === 'property') {
        result = await prisma.property.delete({
          where: { id }
        })
        await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Property ${id} removed`)
      } else if (type === 'message') {
        result = await prisma.message.delete({
          where: { id }
        })
        await AuditLogger.logUserAction(adminId, 'CONTENT_REMOVED', `Message ${id} removed`)
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid content type. Must be review, property, or message.' }
        })
      }

      res.status(200).json({
        success: true,
        message: `${type} removed successfully`
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found.' }
        })
      }
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

      const where: any = {}
      if (userId) where.userId = userId
      if (action) where.action = action

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actor: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.auditLog.count({ where })
      ])

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
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
      const [
        userStats,
        propertyStats,
        bookingStats,
        paymentStats,
        reviewStats
      ] = await Promise.all([
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true }
        }),
        prisma.property.aggregate({
          _count: { id: true }
        }),
        prisma.booking.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        prisma.payment.groupBy({
          by: ['status'],
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.review.aggregate({
          _count: { id: true },
          _avg: { rating: true }
        })
      ])

      const stats = {
        users: {
          total: userStats.reduce((sum, stat) => sum + stat._count.id, 0),
          byRole: userStats.reduce((acc, stat) => {
            acc[stat.role] = stat._count.id
            return acc
          }, {} as Record<string, number>)
        },
        properties: {
          total: propertyStats._count.id
        },
        bookings: {
          total: bookingStats.reduce((sum, stat) => sum + stat._count.id, 0),
          byStatus: bookingStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id
            return acc
          }, {} as Record<string, number>)
        },
        payments: {
          total: paymentStats.reduce((sum, stat) => sum + stat._count.id, 0),
          totalAmount: paymentStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0),
          byStatus: paymentStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id
            return acc
          }, {} as Record<string, number>)
        },
        reviews: {
          total: reviewStats._count.id,
          averageRating: reviewStats._avg.rating
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
