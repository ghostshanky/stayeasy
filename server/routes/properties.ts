import express, { Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { PropertiesController } from '../controllers/propertiesController.js'
import { prisma } from '../lib/prisma'
import rateLimit from 'express-rate-limit'

const propertiesRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const propertyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// Owner routes - using real PropertiesController with Supabase data
propertiesRoutes.post(
  '/owner/properties',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.createProperty
)

propertiesRoutes.put(
  '/owner/properties/:id',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.updateProperty
)

propertiesRoutes.delete(
  '/owner/properties/:id',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.deleteProperty
)

propertiesRoutes.get(
  '/owner/properties',
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.getOwnerProperties
)

// Tenant routes - using real PropertiesController
propertiesRoutes.get(
  '/tenant/properties',
  requireAuth,
  requireRole(['TENANT']),
  PropertiesController.getProperties
)

propertiesRoutes.get(
  '/tenant/properties/:id',
  requireAuth,
  requireRole(['TENANT']),
  PropertiesController.getPropertyDetails
)

// Welcome endpoint for properties API
propertiesRoutes.get(
  '/properties/welcome',
  (req: Request, res: Response) => { res.json({ success: true, message: 'Welcome to the Properties API' }) }
)

// Public endpoint for fetching individual property details (no authentication required)
propertiesRoutes.get(
  '/properties/:id',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              imageId: true,
              createdAt: true
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  imageId: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      const mappedProperty = {
        id: property.id,
        title: property.title,
        description: property.description,
        location: property.location,
        address: property.address,
        price_per_night: property.pricePerNight,
        currency: property.currency,
        images: property.images,
        rating: property.rating,
        rating_count: property.ratingCount,
        amenities: property.amenities,
        tags: property.tags,
        capacity: property.capacity,
        owner_id: property.ownerId,
        status: property.status,
        created_at: property.createdAt,
        updated_at: property.updatedAt,
        owner: property.owner ? {
          id: property.owner.id,
          name: property.owner.name,
          email: property.owner.email,
          avatar_url: property.owner.imageId ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${property.owner.imageId}` : null,
          joined_date: property.owner.createdAt
        } : null,
        reviews: property.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.createdAt,
          user: {
            name: r.user.name,
            avatar_url: r.user.imageId ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${r.user.imageId}` : null
          }
        }))
      };

      res.json({
        success: true,
        data: mappedProperty
      });

    } catch (error: any) {
      console.error('Error in public getPropertyDetails:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch property details'
      });
    }
  }
)

// Public endpoint for fetching properties (no authentication required)
propertiesRoutes.get(
  '/properties',
  async (req: Request, res: Response) => {
    try {
      const {
        minPrice,
        maxPrice,
        city,
        amenities,
        checkIn,
        checkOut,
        guests,
        page = 1,
        limit = 6
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      const where: any = {
        status: 'available',
        available: true
      };

      if (minPrice || maxPrice) {
        where.pricePerNight = {};
        if (minPrice) where.pricePerNight.gte = parseFloat(minPrice as string);
        if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice as string);
      }

      if (city) {
        where.OR = [
          { location: { contains: city as string, mode: 'insensitive' } },
          { address: { contains: city as string, mode: 'insensitive' } },
          { title: { contains: city as string, mode: 'insensitive' } }
        ];
      }

      if (guests) {
        where.capacity = { gte: parseInt(guests as string) };
      }

      // Execute query
      const [total, properties] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { rating: 'desc' },
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                imageId: true
              }
            },
            reviews: {
              select: {
                rating: true
              }
            }
          }
        })
      ]);

      // Filter by amenities if needed (in-memory for now as Prisma Json filtering is limited)
      let filteredProperties = properties;
      if (amenities) {
        const amenitiesList = (amenities as string).split(',').map(a => a.trim().toLowerCase());
        filteredProperties = properties.filter(p => {
          const propAmenities = Array.isArray(p.amenities)
            ? (p.amenities as string[]).map(a => a.toLowerCase())
            : [];
          return amenitiesList.every(a => propAmenities.includes(a));
        });
      }

      // Map to frontend format
      const mappedProperties = filteredProperties.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        location: p.location,
        address: p.address,
        price_per_night: p.pricePerNight,
        currency: p.currency,
        images: p.images,
        rating: p.rating,
        rating_count: p.ratingCount,
        amenities: p.amenities,
        tags: p.tags,
        capacity: p.capacity,
        owner_id: p.ownerId,
        status: p.status,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
        owner: p.owner ? {
          name: p.owner.name,
          email: p.owner.email,
          avatar_url: p.owner.imageId ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${p.owner.imageId}` : null
        } : null
      }));

      res.json({
        success: true,
        data: mappedProperties,
        pagination: {
          total: total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error: any) {
      console.error('Error in public getProperties:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch properties'
      });
    }
  }
)

// Public endpoint for creating a booking (requires authentication)
propertiesRoutes.post(
  '/bookings/create',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { user } = req as any;
      const { propertyId, checkIn, checkOut, guestCount = 1 } = req.body;

      if (!propertyId || !checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          error: 'Property ID, check-in date, and check-out date are required'
        });
      }

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          error: 'Check-out date must be after check-in date'
        });
      }

      if (checkInDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Check-in date must be in the future'
        });
      }

      // Check if property exists and is available
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      // Calculate total amount
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = property.pricePerNight * nights;

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          propertyId,
          checkIn,
          checkOut,
          status: 'PENDING',
          guests: guestCount,
          paymentStatus: 'pending'
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              pricePerNight: true,
              images: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: booking
      });

    } catch (error: any) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create booking'
      });
    }
  }
)

export default propertiesRoutes
