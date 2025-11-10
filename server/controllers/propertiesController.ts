import { Request, Response } from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuditLogger } from '../audit-logger.js';

export class PropertiesController {
  // Get all properties with filtering and pagination
  static async getProperties(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const minPrice = req.query.minPrice as string;
      const maxPrice = req.query.maxPrice as string;
      const city = req.query.city as string;
      const amenities = req.query.amenities as string;

      const offset = (page - 1) * limit;

      // Build the query
      let query = supabaseServer
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
          )
        `, { count: 'exact' });

      // Apply filters
      if (minPrice || maxPrice) {
        query = query.or(`price_per_night.gte.${minPrice},price_per_night.lte.${maxPrice}`);
      }

      if (city) {
        query = query.ilike('location', `%${city}%`);
      }

      if (amenities) {
        // This requires a more complex query with joins
        // For now, we'll filter on the frontend
      }

      // Get total count for pagination
      const { count, error: countError } = await supabaseServer
        .from('properties')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to count properties: ${countError.message}`);
      }

      // Get paginated results
      const { data: properties, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
      }

      // Transform data for frontend
      const transformedProperties = properties.map((property: any) => ({
        id: property.id,
        title: property.title,
        description: property.description,
        location: property.location,
        price_per_night: property.price_per_night,
        rating: property.rating || 0,
        images: property.files?.map((file: any) => file.url) || [],
        amenities: property.property_amenities?.map((pa: any) => pa.amenities?.name) || [],
        created_at: property.created_at,
        updated_at: property.updated_at
      }));

      const totalPages = Math.ceil(count! / limit);

      res.json({
        success: true,
        data: transformedProperties,
        pagination: {
          currentPage: page,
          totalPages,
          total: count!,
          limit
        }
      });

    } catch (error: any) {
      console.error('Get properties error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
      });
    }
  }

  // Create new property (owner only)
  static async createProperty(req: Request, res: Response) {
    try {
      const { title, description, location, price_per_night, amenities, ownerId } = req.body;

      // Validate required fields
      if (!title || !location || !price_per_night || !ownerId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields.' }
        });
      }

      // Insert property
      const { data: property, error: propertyError } = await supabaseServer
        .from('properties')
        .insert({
          title,
          description,
          location,
          price_per_night: parseInt(price_per_night),
          owner_id: ownerId,
          status: 'AVAILABLE'
        })
        .select()
        .single();

      if (propertyError) {
        throw new Error(`Failed to create property: ${propertyError.message}`);
      }

      // Insert amenities if provided
      if (amenities && amenities.length > 0) {
        const amenityInserts = amenities.map((amenityName: string) => ({
          property_id: property.id,
          amenity_name: amenityName
        }));

        const { error: amenityError } = await supabaseServer
          .from('property_amenities')
          .insert(amenityInserts);

        if (amenityError) {
          console.error('Failed to insert amenities:', amenityError);
          // Don't throw here - property was created successfully
        }
      }

      // Log audit event
      await AuditLogger.logPropertyUpdate(ownerId, property.id, { propertyCreated: true });

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
}
