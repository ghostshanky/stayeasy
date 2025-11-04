"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const audit_logger_js_1 = require("../audit-logger.js");
const prisma = new client_1.PrismaClient();
// --- Input Validation Schemas ---
const createPropertySchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(100),
    address: zod_1.z.string().min(10).max(500),
    description: zod_1.z.string().max(1000).optional(),
    price: zod_1.z.number().positive(),
    capacity: zod_1.z.number().int().min(1).max(100),
    details: zod_1.z.array(zod_1.z.object({
        amenity: zod_1.z.string().min(1).max(50),
        value: zod_1.z.string().min(1).max(100)
    })).optional()
});
const updatePropertySchema = createPropertySchema.partial();
const propertyQuerySchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    minPrice: zod_1.z.number().optional(),
    maxPrice: zod_1.z.number().optional(),
    type: zod_1.z.string().optional(),
    amenities: zod_1.z.string().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10)
});
class PropertiesController {
    /**
     * POST /api/owner/properties
     * Creates a new property for the authenticated owner
     */
    static async createProperty(req, res) {
        try {
            const validation = createPropertySchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const ownerId = req.currentUser.id;
            const { name, address, description, price, capacity, details } = validation.data;
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
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logPropertyCreation(ownerId, property.id, name);
            res.status(201).json({
                success: true,
                data: property
            });
        }
        catch (error) {
            console.error('Property creation error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to create property.' }
            });
        }
    }
    /**
     * PUT /api/owner/properties/:id
     * Updates an existing property owned by the authenticated owner
     */
    static async updateProperty(req, res) {
        try {
            const validation = updatePropertySchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const ownerId = req.currentUser.id;
            const propertyId = req.params.id;
            const updates = validation.data;
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
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logPropertyUpdate(ownerId, propertyId, updates);
            res.status(200).json({
                success: true,
                data: property
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
                });
            }
            console.error('Property update error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to update property.' }
            });
        }
    }
    /**
     * DELETE /api/owner/properties/:id
     * Deletes a property owned by the authenticated owner
     */
    static async deleteProperty(req, res) {
        try {
            const ownerId = req.currentUser.id;
            const propertyId = req.params.id;
            await prisma.property.delete({
                where: { id: propertyId, ownerId }
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logPropertyDeletion(ownerId, propertyId);
            res.status(200).json({
                success: true,
                message: 'Property deleted successfully'
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or you do not own it.' }
                });
            }
            console.error('Property deletion error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to delete property.' }
            });
        }
    }
    /**
     * GET /api/tenant/properties
     * Returns a paginated list of properties for tenants to browse
     */
    static async getProperties(req, res) {
        try {
            const validation = propertyQuerySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const { city, minPrice, maxPrice, type, amenities, page, limit } = validation.data;
            const where = {};
            if (city) {
                where.address = { contains: city, mode: 'insensitive' };
            }
            if (minPrice || maxPrice) {
                where.price = {};
                if (minPrice)
                    where.price.gte = minPrice;
                if (maxPrice)
                    where.price.lte = maxPrice;
            }
            if (amenities) {
                const amenityList = amenities.split(',');
                where.details = {
                    some: {
                        amenity: { in: amenityList, mode: 'insensitive' }
                    }
                };
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
            ]);
            // Calculate average ratings
            const propertiesWithRating = properties.map(property => ({
                ...property,
                averageRating: property.reviews.length > 0
                    ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
                    : null
            }));
            res.status(200).json({
                success: true,
                data: propertiesWithRating,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Properties fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
            });
        }
    }
    /**
     * GET /api/tenant/properties/:id
     * Returns detailed information about a specific property
     */
    static async getPropertyDetails(req, res) {
        try {
            const propertyId = req.params.id;
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
            });
            if (!property) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' }
                });
            }
            // Calculate average rating
            const averageRating = property.reviews.length > 0
                ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
                : null;
            res.status(200).json({
                success: true,
                data: {
                    ...property,
                    averageRating
                }
            });
        }
        catch (error) {
            console.error('Property details fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch property details.' }
            });
        }
    }
    /**
     * GET /api/owner/properties
     * Returns properties owned by the authenticated owner
     */
    static async getOwnerProperties(req, res) {
        try {
            const ownerId = req.currentUser.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
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
            ]);
            res.status(200).json({
                success: true,
                data: properties,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Owner properties fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties.' }
            });
        }
    }
}
exports.PropertiesController = PropertiesController;
