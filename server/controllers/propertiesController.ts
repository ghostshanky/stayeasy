import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { AuditLogger } from '../audit-logger.js'

const prisma = new PrismaClient()

// --- Input Validation Schemas ---
const createPropertySchema = z.object({
  name: z.string().min(3).max(100),
  address: z.string().min(10).max(500),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  capacity: z.number().int().min(1).max(100),
  details: z.array(z.object({
    amenity: z.string().min(1).max(50),
    value: z.string().min(1).max(100)
  })).optional()
})

const updatePropertySchema = createPropertySchema.partial()

const propertyQuerySchema = z.object({
  city: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  amenities: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export class PropertiesController {
  /**
   * POST /api/owner/properties
   * Creates a new property for the authenticated owner
   */
  static async createProperty(req: Request, res: Response) {
    try {
      const validation = createPropertySchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const ownerId = req.currentUser!.id
      const { name, address, description, price, capacity, details } = validation.data

      const property = await prisma.property.create({
        data: {
          ownerId,
          name,
          address,
          description,
          price,
          capacity,
          details: details ? {
            create: details
          } : undefined
        },
        include: { details: true }
      })

      // Log audit event
      await AuditLogger.logPropertyCreation(ownerId, property.id, name)

      res.status(201).json({
        success: true,
        data: property
      })
    } catch (error: any) {
      console.error('Property creation error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create property.' }
      })
    }
  }

  /**
   * PUT /api/owner/properties/:id
   * Updates an existing property owned by the authenticated owner
   */
  static async updateProperty(req: Request, res: Response) {
    try {
      const validation = updatePropertySchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const ownerId = req.currentUser!.id
      const propertyId = req.params.id
      const updates = validation.data

      const property = await prisma.property.update({
        where: { id: propertyId, ownerId },
        data: {
          ...updates,
          details: updates.details ? {
            deleteMany: {},
            create: updates.details
          } : undefined
        },
        include: { details: true }
      })

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, propertyId, updates)

      res.status(200).json({
        success: true,
        data: property
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        })
      }
      console.error('Property update error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update property.' }
      })
    }
  }

  /**
   * DELETE /api/owner/properties/:id
   * Deletes a property owned by the authenticated owner
   */
  static async deleteProperty(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const propertyId = req.params.id

      await prisma.property.delete({
        where: { id: propertyId, ownerId }
      })

      // Log audit event
      await AuditLogger.logPropertyDeletion(ownerId, propertyId)

      res.status(200).json({
        success: true,
        message: 'Property deleted successfully'
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        })
      }
      console.error('Property deletion error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete property.' }
      })
    }
  }

  /**
   * GET /api/tenant/properties
   * Returns a paginated list of properties for tenants to browse
   */
  static async getProperties(req: Request, res: Response) {
    try {
      const validation = propertyQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const { city, minPrice, maxPrice, amenities, page, limit } = validation.data

      const where: any = {}

      if (city) {
        where.address = { contains: city, mode: 'insensitive' }
      }

      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = minPrice
        if (maxPrice) where.price.lte = maxPrice
      }

      if (amenities) {
        const amenityList = amenities.split(',')
        where.details = {
          some: {
            amenity: { in: amenityList, mode: 'insensitive' }
          }
        }
      }

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            details: true,
            reviews: {
              select: { rating: true }
            },
            owner: {
              select: { name: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.property.count({ where })
      ])

      // Calculate average ratings
      const propertiesWithRating = properties.map(property => ({
        ...property,
        averageRating: property.reviews.length > 0
          ? property.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / property.reviews.length
          : null
      }))

      res.status(200).json({
        success: true,
        data: propertiesWithRating,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Properties fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
      })
    }
  }

  /**
   * GET /api/tenant/properties/:id
   * Returns detailed information about a specific property
   */
  static async getPropertyDetails(req: Request, res: Response) {
    try {
      const propertyId = req.params.id

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          details: true,
          reviews: {
            include: {
              user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          owner: {
            select: { name: true, email: true }
          }
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
        })
      }

      // Calculate average rating
      const averageRating = property.reviews.length > 0
        ? property.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / property.reviews.length
        : null

      res.status(200).json({
        success: true,
        data: {
          ...property,
          averageRating
        }
      })
    } catch (error: any) {
      console.error('Property details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch property details.' }
      })
    }
  }

  /**
   * GET /api/owner/properties
   * Returns properties owned by the authenticated owner
   */
  static async getOwnerProperties(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { ownerId },
          include: {
            details: true,
            bookings: {
              where: { status: { in: ['PENDING', 'CONFIRMED'] } },
              select: { id: true, checkIn: true, checkOut: true, status: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.property.count({ where: { ownerId } })
      ])

      res.status(200).json({
        success: true,
        data: properties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Owner properties fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
      })
    }
  }

  /**
   * PUT /api/owner/properties/:id/availability
   * Manages availability for a property owned by the authenticated owner
   */
  static async manageAvailability(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const propertyId = req.params.id
      const { availableDates } = req.body

      // Validate input
      if (!Array.isArray(availableDates)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'availableDates must be an array' }
        })
      }

      // Verify property ownership
      const property: any = await prisma.property.findFirst({
        where: { id: propertyId, ownerId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        })
      }

      // Validate date ranges
      for (const range of availableDates) {
        if (!range.start || !range.end) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Each date range must have start and end dates' }
          })
        }

        const startDate = new Date(range.start)
        const endDate = new Date(range.end)

        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_DATES', message: 'End date must be after start date' }
          })
        }
      }

      // Delete existing availability and create new ones
      await prisma.availability.deleteMany({
        where: { propertyId }
      })

      const availabilities = await prisma.availability.createMany({
        data: availableDates.map(range => ({
          propertyId,
          startDate: new Date(range.start),
          endDate: new Date(range.end)
        }))
      })

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, propertyId, { availability: availableDates })

      res.status(200).json({
        success: true,
        message: 'Availability updated successfully',
        data: { count: availabilities.count }
      })
    } catch (error: any) {
      console.error('Manage availability error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update availability.' }
      })
    }
  }

  /**
   * POST /api/owner/properties/:id/images
   * Uploads images for a property owned by the authenticated owner
   */
  static async uploadPropertyImages(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const propertyId = req.params.id
      const { imageUrls } = req.body

      // Validate input
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'imageUrls must be a non-empty array' }
        })
      }

      if (imageUrls.length > 10) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOO_MANY_IMAGES', message: 'Maximum 10 images allowed' }
        })
      }

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        })
      }

      // Create file records for each image
      const fileRecords = imageUrls.map(url => ({
        url,
        fileName: url.split('/').pop() || 'image.jpg',
        fileType: 'image/jpeg',
        purpose: 'PROPERTY_IMAGE' as const,
        userId: ownerId,
        propertyId,
        status: 'AVAILABLE' as const
      }))

      const files = await prisma.file.createMany({
        data: fileRecords
      })

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, propertyId, { imagesUploaded: imageUrls.length })

      res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: { uploaded: files.count }
      })
    } catch (error: any) {
      console.error('Upload property images error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to upload images.' }
      })
    }
  }
}
