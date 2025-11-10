import { Request, Response } from 'express';

export class MockPropertiesController {
  // Mock properties data
  private static mockProperties = [
    {
      id: '1',
      title: 'Cozy Shared Room near University',
      description: 'Shared room with high-speed internet, 24/7 security, and access to common areas. Perfect for students and young professionals.',
      location: 'Koramangala, Bangalore',
      price_per_night: 8500,
      rating: 4.8,
      images: [
        'https://via.placeholder.com/400x300?text=Property+1',
        'https://via.placeholder.com/400x300?text=Property+1+2'
      ],
      amenities: ['WiFi', '24/7 Security', 'Laundry', 'Kitchen', 'Gym'],
      status: 'AVAILABLE',
      created_at: new Date('2024-01-15').toISOString(),
      updated_at: new Date('2024-01-15').toISOString(),
      owner: {
        id: 'owner1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: '2',
      title: 'Modern PG for Professionals',
      description: 'Private room in a modern PG with gym, swimming pool, and cafeteria. Ideal for working professionals.',
      location: 'Hiranandani, Mumbai',
      price_per_night: 15000,
      rating: 4.5,
      images: [
        'https://via.placeholder.com/400x300?text=Property+2',
        'https://via.placeholder.com/400x300?text=Property+2+2'
      ],
      amenities: ['WiFi', 'Gym', 'Swimming Pool', 'Cafeteria', 'Parking'],
      status: 'AVAILABLE',
      created_at: new Date('2024-01-20').toISOString(),
      updated_at: new Date('2024-01-20').toISOString(),
      owner: {
        id: 'owner2',
        name: 'Jane Smith',
        email: 'jane@example.com'
      }
    },
    {
      id: '3',
      title: 'Student Hub Downtown',
      description: 'Student-friendly accommodation with study areas, laundry facilities, and mess service.',
      location: 'FC Road, Pune',
      price_per_night: 7200,
      rating: 4.6,
      images: [
        'https://via.placeholder.com/400x300?text=Property+3'
      ],
      amenities: ['WiFi', 'Study Area', 'Laundry', 'Mess', 'Library'],
      status: 'AVAILABLE',
      created_at: new Date('2024-02-01').toISOString(),
      updated_at: new Date('2024-02-01').toISOString(),
      owner: {
        id: 'owner3',
        name: 'Raj Patel',
        email: 'raj@example.com'
      }
    },
    {
      id: '4',
      title: 'The Executive Stay',
      description: 'Luxury private room with premium amenities, concierge service, and access to business center.',
      location: 'Cyber City, Gurgaon',
      price_per_night: 22500,
      rating: 4.9,
      images: [
        'https://via.placeholder.com/400x300?text=Property+4',
        'https://via.placeholder.com/400x300?text=Property+4+2',
        'https://via.placeholder.com/400x300?text=Property+4+3'
      ],
      amenities: ['WiFi', 'Concierge', 'Business Center', 'Gym', 'Spa', 'Parking'],
      status: 'AVAILABLE',
      created_at: new Date('2024-02-10').toISOString(),
      updated_at: new Date('2024-02-10').toISOString(),
      owner: {
        id: 'owner4',
        name: 'Sarah Johnson',
        email: 'sarah@example.com'
      }
    },
    {
      id: '5',
      title: 'Beachside Villa',
      description: 'Beautiful villa with beach access, perfect for vacation and long-term stays.',
      location: 'Goa',
      price_per_night: 18000,
      rating: 4.7,
      images: [
        'https://via.placeholder.com/400x300?text=Property+5'
      ],
      amenities: ['WiFi', 'Beach Access', 'Swimming Pool', 'Kitchen', 'AC'],
      status: 'AVAILABLE',
      created_at: new Date('2024-02-15').toISOString(),
      updated_at: new Date('2024-02-15').toISOString(),
      owner: {
        id: 'owner5',
        name: 'Mike Brown',
        email: 'mike@example.com'
      }
    }
  ];

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

      // Filter properties based on query parameters
      let filteredProperties = [...MockPropertiesController.mockProperties];

      // Apply price filter
      if (minPrice) {
        filteredProperties = filteredProperties.filter(p => p.price_per_night >= parseInt(minPrice));
      }
      if (maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.price_per_night <= parseInt(maxPrice));
      }

      // Apply city filter
      if (city) {
        filteredProperties = filteredProperties.filter(p => 
          p.location.toLowerCase().includes(city.toLowerCase())
        );
      }

      // Apply amenities filter
      if (amenities) {
        const amenityList = amenities.split(',').map(a => a.trim());
        filteredProperties = filteredProperties.filter(p =>
          amenityList.every(amenity => 
            p.amenities.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
          )
        );
      }

      // Get total count for pagination
      const total = filteredProperties.length;
      const totalPages = Math.ceil(total / limit);

      // Apply pagination
      const paginatedProperties = filteredProperties.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedProperties,
        pagination: {
          currentPage: page,
          totalPages,
          total,
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

      // Create new property
      const newProperty = {
        id: `prop-${Date.now()}`,
        title,
        description,
        location,
        price_per_night: parseInt(price_per_night),
        rating: 0,
        images: [],
        amenities: amenities || [],
        status: 'AVAILABLE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: {
          id: ownerId,
          name: 'Mock Owner',
          email: 'mock@example.com'
        }
      };

      MockPropertiesController.mockProperties.push(newProperty);

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: newProperty
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
      const updates = req.body;

      // Find property
      const propertyIndex = MockPropertiesController.mockProperties.findIndex(p => p.id === propertyId);
      
      if (propertyIndex === -1) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
        });
      }

      // Update property
      const updatedProperty = {
        ...MockPropertiesController.mockProperties[propertyIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      MockPropertiesController.mockProperties[propertyIndex] = updatedProperty;

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: updatedProperty
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

      // Find and remove property
      const propertyIndex = MockPropertiesController.mockProperties.findIndex(p => p.id === propertyId);
      
      if (propertyIndex === -1) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
        });
      }

      MockPropertiesController.mockProperties.splice(propertyIndex, 1);

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

      // Filter properties by owner
      const ownerProperties = MockPropertiesController.mockProperties.filter(p => p.owner.id === ownerId);
      
      const total = ownerProperties.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedProperties = ownerProperties.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedProperties,
        pagination: {
          currentPage: page,
          totalPages,
          total,
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

      // Find property
      const property = MockPropertiesController.mockProperties.find(p => p.id === propertyId);

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
        });
      }

      // Add mock reviews
      const propertyWithReviews = {
        ...property,
        reviews: [
          {
            id: '1',
            rating: 5,
            comment: 'Great place to stay!',
            created_at: new Date('2024-01-20').toISOString(),
            user: {
              name: 'Alice'
            }
          },
          {
            id: '2',
            rating: 4,
            comment: 'Good location and amenities.',
            created_at: new Date('2024-01-25').toISOString(),
            user: {
              name: 'Bob'
            }
          }
        ]
      };

      res.json({
        success: true,
        data: propertyWithReviews
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