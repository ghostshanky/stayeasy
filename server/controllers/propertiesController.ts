import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class PropertiesController {
  // Get all properties with filters
  static async getProperties(req: Request, res: Response) {
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
        limit = 12
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
          orderBy: { createdAt: 'desc' },
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
      console.error('Error in getProperties:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch properties'
      });
    }
  }

  // Get properties for a specific owner
  static async getOwnerProperties(req: Request, res: Response) {
    try {
      // Try to get ownerId from authenticated user first, then query params, then route params
      const ownerId = (req as any).currentUser?.id || req.query.ownerId || req.params.ownerId;

      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'Owner ID is required'
        });
      }

      const properties = await prisma.property.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' }
      });

      const mappedProperties = properties.map(p => ({
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
        updated_at: p.updatedAt
      }));

      res.json({
        success: true,
        data: mappedProperties
      });

    } catch (error: any) {
      console.error('Error in getOwnerProperties:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch owner properties'
      });
    }
  }

  // Get single property details
  static async getPropertyDetails(req: Request, res: Response) {
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
      console.error('Error in getPropertyDetails:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch property details'
      });
    }
  }

  // Create new property
  static async createProperty(req: Request, res: Response) {
    try {
      const {
        title,
        description,
        location,
        address,
        price_per_night,
        pricePerNight,
        images,
        amenities,
        tags,
        capacity
      } = req.body;

      const ownerId = (req as any).currentUser?.id;
      const price = price_per_night || pricePerNight;

      // Validate required fields
      if (!title || !location || !price || !ownerId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const property = await prisma.property.create({
        data: {
          title,
          description,
          location,
          address,
          pricePerNight: parseFloat(price),
          images: images || [],
          amenities: amenities || [],
          tags: tags || [],
          capacity: parseInt(capacity) || 1,
          ownerId: ownerId,
          status: 'available',
          available: true
        }
      });

      res.status(201).json({
        success: true,
        data: {
          id: property.id,
          message: 'Property created successfully'
        }
      });

    } catch (error: any) {
      console.error('Error in createProperty:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create property'
      });
    }
  }

  // Update property
  static async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Map frontend fields to Prisma fields
      const prismaUpdates: any = {};
      if (updates.title) prismaUpdates.title = updates.title;
      if (updates.description) prismaUpdates.description = updates.description;
      if (updates.location) prismaUpdates.location = updates.location;
      if (updates.address) prismaUpdates.address = updates.address;
      if (updates.price_per_night) prismaUpdates.pricePerNight = parseFloat(updates.price_per_night);
      if (updates.images) prismaUpdates.images = updates.images;
      if (updates.amenities) prismaUpdates.amenities = updates.amenities;
      if (updates.tags) prismaUpdates.tags = updates.tags;
      if (updates.capacity) prismaUpdates.capacity = parseInt(updates.capacity);
      if (updates.status) prismaUpdates.status = updates.status;
      if (updates.available !== undefined) prismaUpdates.available = updates.available;

      const property = await prisma.property.update({
        where: { id },
        data: prismaUpdates
      });

      res.json({
        success: true,
        data: {
          id: property.id,
          message: 'Property updated successfully'
        }
      });

    } catch (error: any) {
      console.error('Error in updateProperty:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update property'
      });
    }
  }

  // Delete property
  static async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.property.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: {
          message: 'Property deleted successfully'
        }
      });

    } catch (error: any) {
      console.error('Error in deleteProperty:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete property'
      });
    }
  }

  // Get welcome message for properties API
  static async getWelcome(req: Request, res: Response) {
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: 'Welcome to the Properties API!' });
  }
}
