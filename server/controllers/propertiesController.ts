import { Request, Response } from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuditLogger } from '../audit-logger.js';

export class PropertiesController {
  // Get all properties with filtering and pagination
  static async getProperties(req: Request, res: Response) {
    try {
      console.log('🔍 [PropertiesController] Using real Supabase data for getProperties');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const minPrice = (req.query.minPrice as string) || undefined;
      const maxPrice = (req.query.maxPrice as string) || undefined;
      const city = (req.query.city as string) || undefined;
      const amenities = (req.query.amenities as string) || undefined;

      const offset = (page - 1) * limit;

      try {
        console.log('🔍 [PropertiesController] Attempting to fetch from Supabase...');
        console.log('🔍 [PropertiesController] SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
        console.log('🔍 [PropertiesController] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

        // Helper to apply filters to a query
        const applyFilters = (qb: any) => {
          let q = qb;
          if (minPrice) {
            const min = parseFloat(minPrice);
            if (!Number.isNaN(min)) q = q.gte('price_per_night', min);
          }
          if (maxPrice) {
            const max = parseFloat(maxPrice);
            if (!Number.isNaN(max)) q = q.lte('price_per_night', max);
          }
          if (city) {
            q = q.ilike('location', `%${city}%`);
          }
          if (amenities) {
            // Supabase supports Postgres array operations: use contains for text[]
            const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
            if (amenityList.length > 0) {
              q = q.contains('amenities', amenityList);
            }
          }
          return q;
        };

        // Count query (use same filters)
        const countQuery = applyFilters(
          supabaseServer.from('properties').select('*', { head: true, count: 'exact' })
        );

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error('❌ [PropertiesController] Count query error:', countError);
          console.error('❌ [PropertiesController] Count error details:', {
            message: countError.message,
            code: countError.code,
            details: countError.details,
            hint: countError.hint
          });
          // Return empty result instead of falling back to mock to avoid surprising UI behavior
          return res.json({ success: true, data: [], pagination: { currentPage: page, totalPages: 0, total: 0, limit } });
        }

        console.log('🔍 [PropertiesController] Total properties found:', count);

        // Data query with same filters
        let dataQuery = applyFilters(supabaseServer.from('properties').select('*'));

        const { data: properties, error } = await dataQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('❌ [PropertiesController] Supabase data query error:', error);
          // Return empty result instead of mock fallback
          return res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: error.message } });
        }

        console.log('🔍 [PropertiesController] Fetched properties:', properties?.length || 0);

        // Transform data for frontend
        const transformedProperties = (properties || []).map((property: any) => ({
          id: property.id,
          title: property.title,
          description: property.description,
          location: property.location,
          price_per_night: property.price_per_night,
          rating: property.rating || 0,
          images: property.images || [],
          amenities: property.amenities || [],
          tags: property.tags || [],
          capacity: property.capacity,
          created_at: property.created_at,
          updated_at: property.updated_at
        }));

        console.log('✅ [PropertiesController] Transformed properties:', transformedProperties.length);

        const totalPages = Math.ceil((count || 0) / limit);

        res.json({
          success: true,
          data: transformedProperties,
          pagination: {
            currentPage: page,
            totalPages,
            total: count || 0,
            limit
          }
        });
      } catch (dbError: any) {
        console.warn('Database connection failed, returning sample properties for development:', dbError.message);
        
        // Return sample properties for development/testing
        const sampleProperties = [
          {
            id: crypto.randomUUID(),
            title: "Modern PG near Tech Park",
            description: "Spacious and modern PG accommodation with high-speed internet and 24/7 security",
            location: "Bangalore, Karnataka",
            price_per_night: 8500,
            rating: 4.5,
            images: ["https://via.placeholder.com/400x300?text=Property+1"],
            amenities: ["WiFi", "AC", "Security", "Laundry"],
            tags: ["Modern", "Tech-friendly"],
            capacity: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: "Cozy Hostel in City Center",
            description: "Affordable hostel accommodation with common areas and social activities",
            location: "Mumbai, Maharashtra",
            price_per_night: 4500,
            rating: 4.2,
            images: ["https://via.placeholder.com/400x300?text=Property+2"],
            amenities: ["WiFi", "Kitchen", "Common Area", "Security"],
            tags: ["Affordable", "Social"],
            capacity: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: "Luxury Apartment PG",
            description: "Premium PG accommodation with premium amenities and excellent location",
            location: "Delhi NCR",
            price_per_night: 12000,
            rating: 4.8,
            images: ["https://via.placeholder.com/400x300?text=Property+3"],
            amenities: ["WiFi", "AC", "Gym", "Swimming Pool", "Security"],
            tags: ["Luxury", "Premium"],
            capacity: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: "Student Hostel near University",
            description: "Student-friendly hostel with study areas and community events",
            location: "Pune, Maharashtra",
            price_per_night: 3500,
            rating: 4.3,
            images: ["https://via.placeholder.com/400x300?text=Property+4"],
            amenities: ["WiFi", "Study Area", "Library", "Mess", "Security"],
            tags: ["Student", "Academic"],
            capacity: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: "Family PG with Amenities",
            description: "Family-friendly PG with child-safe facilities and community activities",
            location: "Chennai, Tamil Nadu",
            price_per_night: 6800,
            rating: 4.6,
            images: ["https://via.placeholder.com/400x300?text=Property+5"],
            amenities: ["WiFi", "AC", "Play Area", "Security", "Kitchen"],
            tags: ["Family", "Child-friendly"],
            capacity: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: "Working Professional PG",
            description: "Professional PG with workspaces and networking opportunities",
            location: "Hyderabad, Telangana",
            price_per_night: 7500,
            rating: 4.4,
            images: ["https://via.placeholder.com/400x300?text=Property+6"],
            amenities: ["WiFi", "Work Space", "Networking", "Security"],
            tags: ["Professional", "Work"],
            capacity: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        // Apply filters to sample properties
        let filteredProperties = sampleProperties;
        if (minPrice) {
          const min = parseFloat(minPrice);
          if (!Number.isNaN(min)) {
            filteredProperties = filteredProperties.filter(p => p.price_per_night >= min);
          }
        }
        if (maxPrice) {
          const max = parseFloat(maxPrice);
          if (!Number.isNaN(max)) {
            filteredProperties = filteredProperties.filter(p => p.price_per_night <= max);
          }
        }
        if (city) {
          filteredProperties = filteredProperties.filter(p =>
            p.location.toLowerCase().includes(city.toLowerCase())
          );
        }
        if (amenities) {
          const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
          if (amenityList.length > 0) {
            filteredProperties = filteredProperties.filter(p =>
              amenityList.some(amenity =>
                p.amenities.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
              )
            );
          }
        }

        const paginatedProperties = filteredProperties.slice(offset, offset + limit);
        
        return res.json({
          success: true,
          data: paginatedProperties,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredProperties.length / limit),
            total: filteredProperties.length,
            limit
          }
        });
      }

    } catch (error: any) {
      console.error('Get properties error:', error);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  }

  // Create new property (owner only)
  static async createProperty(req: Request, res: Response) {
    try {
      const { title, description, location, price_per_night, capacity, amenities, images, tags, owner_id } = req.body;

      // Validate required fields
      if (!title || !location || !price_per_night || !capacity || !owner_id) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields.' }
        });
      }

      console.log('🔍 [PropertiesController] Using real Supabase data for createProperty');

      const now = new Date().toISOString();
      const { data: property, error } = await supabaseServer
        .from('properties')
        .insert({
          id: crypto.randomUUID(),
          title,
          location,
          description,
          price_per_night: parseFloat(price_per_night),
          capacity: parseInt(capacity),
          owner_id,
          images: images || [],
          amenities: amenities || [],
          tags: tags || [],
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create property: ${error.message}`);
      }

      // Log audit event
      await AuditLogger.logPropertyUpdate(owner_id, property.id, { propertyCreated: true });

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });

    } catch (error: any) {
      console.error('Create property error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create property.' }
      });
    }
  }

  // Update property (owner only)
  static async updateProperty(req: Request, res: Response) {
    try {
      const propertyId = req.params.id;
      const ownerId = req.body.ownerId;
      const updates = req.body;

      // Remove ownerId from updates as it shouldn't be changed
      delete updates.ownerId;

      // Update property
      const { data: property, error } = await supabaseServer
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update property: ${error.message}`);
      }

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        });
      }

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, propertyId, updates);

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: property
      });

    } catch (error: any) {
      console.error('Update property error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update property.' }
      });
    }
  }

  // Delete property (owner only)
  static async deleteProperty(req: Request, res: Response) {
    try {
      const propertyId = req.params.id;
      const ownerId = req.body.ownerId;

      // Delete property
      const { data: property, error } = await supabaseServer
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
      }

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
        });
      }

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, propertyId, { propertyDeleted: true });

      res.json({
        success: true,
        message: 'Property deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete property error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete property.' }
      });
    }
  }

  // Get owner properties
  static async getOwnerProperties(req: Request, res: Response) {
    try {
      const ownerId = req.query.ownerId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing ownerId parameter.' }
        });
      }

      console.log('🔍 [PropertiesController] Using real Supabase data for getOwnerProperties');

      const offset = (page - 1) * limit;

      // Get owner's properties
      const { data: properties, count, error } = await supabaseServer
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
      }

      const totalPages = Math.ceil(count! / limit);

      res.json({
        success: true,
        data: properties,
        pagination: {
          currentPage: page,
          totalPages,
          total: count!,
          limit
        }
      });

    } catch (error: any) {
      console.error('Get owner properties error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
      });
    }
  }

  // Get property details
  static async getPropertyDetails(req: Request, res: Response) {
    try {
      const propertyId = req.params.id;

      // Get property details
      const { data: property, error } = await supabaseServer
        .from('properties')
        .select(`
          *,
          property_amenities (
            amenities (
              name
            )
          ),
          files (
            url,
            file_name
          ),
          reviews (
            rating,
            comment,
            created_at,
            user:users (
              name
            )
          )
        `)
        .eq('id', propertyId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch property: ${error.message}`);
      }

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
        });
      }

      // Transform data
      const transformedProperty = {
        id: property.id,
        title: property.title,
        description: property.description,
        location: property.location,
        price_per_night: property.price_per_night,
        rating: property.rating || 0,
        images: property.files?.map((file: any) => file.url) || [],
        amenities: property.property_amenities?.map((pa: any) => pa.amenities?.name) || [],
        reviews: property.reviews || [],
        created_at: property.created_at,
        updated_at: property.updated_at
      };

      res.json({
        success: true,
        data: transformedProperty
      });

    } catch (error: any) {
      console.error('Get property details error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch property details.' }
      });
    }
  }

  // Get welcome message for properties API
  static async getWelcome(req: Request, res: Response) {
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: 'Welcome to the Properties API!' });
  }
}
