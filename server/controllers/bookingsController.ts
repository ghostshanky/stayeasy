import { Request, Response } from 'express'
import { z } from 'zod'
import { AuditLogger } from '../audit-logger.js'
import { supabaseServer } from '../lib/supabaseServer.js'

// --- Input Validation Schemas ---
const createBookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-in date'
  }),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-out date'
  })
})

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-in date'
  }).optional(),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid check-out date'
  }).optional()
})

const bookingQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export class BookingsController {
  /**
   * POST /api/tenant/bookings
   * Creates a new booking for the authenticated tenant
   */
  static async createBooking(req: Request, res: Response) {
    try {
      const validation = createBookingSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const { propertyId, checkIn, checkOut } = validation.data

      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)

      // Validate dates
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: 'Check-out date must be after check-in date' }
        })
      }

      if (checkInDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: 'Check-in date cannot be in the past' }
        })
      }

      // Check if property exists and is available
      const { data: property, error: propertyError } = await supabaseServer
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (propertyError || !property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
        })
      }

      // Check for booking conflicts
      const { data: conflictingBookings, error: conflictError } = await supabaseServer
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['PENDING', 'CONFIRMED'])
        .or(`and(check_in.lte.${checkInDate.toISOString()},check_out.gt.${checkInDate.toISOString()}),and(check_in.lt.${checkOutDate.toISOString()},check_out.gte.${checkOutDate.toISOString()}),and(check_in.gte.${checkInDate.toISOString()},check_out.lte.${checkOutDate.toISOString()})`)

      if (conflictError) {
        throw conflictError
      }

      if (conflictingBookings && conflictingBookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: { code: 'BOOKING_CONFLICT', message: 'Property is not available for the selected dates' }
        })
      }

      // Create booking
      const { data: booking, error: createError } = await supabaseServer
        .from('bookings')
        .insert({
          user_id: tenantId,
          property_id: propertyId,
          check_in: checkInDate.toISOString(),
          check_out: checkOutDate.toISOString(),
          status: 'PENDING'
        })
        .select(`
          *,
          property:properties!property_id (
            *,
            owner:users!owner_id (name, email)
          )
        `)
        .single()

      if (createError) {
        throw createError
      }

      // Log audit event
      await AuditLogger.logBookingCreation(tenantId, propertyId, booking.id, checkInDate, checkOutDate)

      res.status(201).json({
        success: true,
        data: booking
      })
    } catch (error: any) {
      console.error('Booking creation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking.' }
      })
    }
  }

  /**
   * PUT /api/tenant/bookings/:id
   * Updates an existing booking owned by the authenticated tenant
   */
  static async updateBooking(req: Request, res: Response) {
    try {
      const validation = updateBookingSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const bookingId = req.params.id
      const updates = validation.data

      // Validate date changes if provided
      if (updates.checkIn && updates.checkOut) {
        const checkInDate = new Date(updates.checkIn)
        const checkOutDate = new Date(updates.checkOut)

        if (checkInDate >= checkOutDate) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_DATES', message: 'Check-out date must be after check-in date' }
          })
        }
      }

      const booking = await prisma.booking.update({
        where: { id: bookingId, userId: tenantId },
        data: {
          ...updates,
          ...(updates.checkIn && { checkIn: new Date(updates.checkIn) }),
          ...(updates.checkOut && { checkOut: new Date(updates.checkOut) })
        },
        include: {
          property: {
            include: {
              owner: { select: { name: true, email: true } }
            }
          }
        }
      })

      // Log audit event
      await AuditLogger.logBookingUpdate(tenantId, bookingId, updates)

      res.status(200).json({
        success: true,
        data: booking
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or you do not own it.' }
        })
      }
      console.error('Booking update error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update booking.' }
      })
    }
  }

  /**
   * DELETE /api/tenant/bookings/:id
   * Cancels a booking owned by the authenticated tenant
   */
  static async cancelBooking(req: Request, res: Response) {
    try {
      const tenantId = req.currentUser!.id
      const bookingId = req.params.id

      // Check if booking can be cancelled
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: tenantId,
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or cannot be cancelled.' }
        })
      }

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      })

      // Log audit event
      await AuditLogger.logBookingStatusChange(tenantId, bookingId, booking.status, 'CANCELLED')

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully'
      })
    } catch (error: any) {
      console.error('Booking cancellation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel booking.' }
      })
    }
  }

  /**
   * GET /api/tenant/bookings
   * Returns bookings for the authenticated tenant
   */
  static async getTenantBookings(req: Request, res: Response) {
    try {
      const validation = bookingQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const { status, page, limit } = validation.data

      const where: any = { userId: tenantId }
      if (status) {
        where.status = status
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            property: {
              include: {
                owner: { select: { name: true, email: true } },
                reviews: {
                  select: { rating: true }
                }
              }
            },
            payments: {
              select: { id: true, status: true, amount: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.booking.count({ where })
      ])

      // Calculate average ratings for properties
      const bookingsWithRating = bookings.map(booking => ({
        ...booking,
        property: {
          ...booking.property,
          averageRating: booking.property.reviews.length > 0
            ? booking.property.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / booking.property.reviews.length
            : null
        }
      }))

      res.status(200).json({
        success: true,
        data: bookingsWithRating,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Tenant bookings fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings.' }
      })
    }
  }

  /**
   * GET /api/tenant/bookings/:id
   * Returns detailed information about a specific booking
   */
  static async getBookingDetails(req: Request, res: Response) {
    try {
      const tenantId = req.currentUser!.id
      const bookingId = req.params.id

      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: tenantId
        },
        include: {
          property: {
            include: {
              owner: { select: { name: true, email: true } },
              details: true,
              reviews: {
                include: {
                  user: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          payments: {
            include: {
              invoice: true
            },
            orderBy: { createdAt: 'desc' }
          },
          invoices: true
        }
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' }
        })
      }

      // Calculate average rating
      const averageRating = booking.property.reviews.length > 0
        ? booking.property.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / booking.property.reviews.length
        : null

      res.status(200).json({
        success: true,
        data: {
          ...booking,
          property: {
            ...booking.property,
            averageRating
          }
        }
      })
    } catch (error: any) {
      console.error('Booking details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch booking details.' }
      })
    }
  }

  /**
   * GET /api/owner/bookings
   * Returns bookings for properties owned by the authenticated owner
   */
  static async getOwnerBookings(req: Request, res: Response) {
    try {
      const validation = bookingQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const ownerId = req.currentUser!.id
      const { status, page, limit } = validation.data

      const where: any = {
        property: { ownerId }
      }
      if (status) {
        where.status = status
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            property: {
              select: { id: true, name: true, address: true }
            },
            user: {
              select: { id: true, name: true, email: true }
            },
            payments: {
              select: { id: true, status: true, amount: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.booking.count({ where })
      ])

      res.status(200).json({
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Owner bookings fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings.' }
      })
    }
  }

  /**
   * PUT /api/owner/bookings/:id/status
   * Updates booking status by the property owner
   */
  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const bookingId = req.params.id
      const { status } = req.body

      if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Invalid status. Must be CONFIRMED, CANCELLED, or COMPLETED.' }
        })
      }

      // Find booking and verify ownership
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          property: { ownerId }
        },
        include: {
          property: true,
          user: { select: { name: true, email: true } }
        }
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or you do not own the property.' }
        })
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['COMPLETED', 'CANCELLED'],
        'CANCELLED': [],
        'COMPLETED': []
      }

      if (!validTransitions[booking.status].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TRANSITION', message: `Cannot change status from ${booking.status} to ${status}.` }
        })
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: status as any },
        include: {
          property: {
            select: { id: true, name: true, address: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Log audit event
      await AuditLogger.logBookingStatusChange(ownerId, bookingId, booking.status, status)

      res.status(200).json({
        success: true,
        data: updatedBooking
      })
    } catch (error: any) {
      console.error('Booking status update error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update booking status.' }
      })
    }
  }

  /**
   * PUT /api/owner/bookings/:id/cancel
   * Cancels a booking by the property owner
   */
  static async cancelBookingByOwner(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const bookingId = req.params.id
      const { reason } = req.body

      // Find booking and verify ownership
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          property: { ownerId },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          property: true,
          user: { select: { name: true, email: true } }
        }
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found, you do not own the property, or booking cannot be cancelled.' }
        })
      }

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      })

      // Log audit event
      await AuditLogger.logBookingStatusChange(ownerId, bookingId, booking.status, 'CANCELLED')

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully'
      })
    } catch (error: any) {
      console.error('Owner booking cancellation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel booking.' }
      })
    }
  }
}
