"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const audit_logger_js_1 = require("../audit-logger.js");
const prisma = new client_1.PrismaClient();
// --- Input Validation Schemas ---
const createBookingSchema = zod_1.z.object({
    propertyId: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid check-in date'
    }),
    checkOut: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid check-out date'
    })
});
const updateBookingSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    checkIn: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid check-in date'
    }).optional(),
    checkOut: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid check-out date'
    }).optional()
});
const bookingQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(10)
});
class BookingsController {
    /**
     * POST /api/tenant/bookings
     * Creates a new booking for the authenticated tenant
     */
    static async createBooking(req, res) {
        try {
            const validation = createBookingSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const tenantId = req.currentUser.id;
            const { propertyId, checkIn, checkOut } = validation.data;
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            // Validate dates
            if (checkInDate >= checkOutDate) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_DATES', message: 'Check-out date must be after check-in date' }
                });
            }
            if (checkInDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_DATES', message: 'Check-in date cannot be in the past' }
                });
            }
            // Check if property exists and is available
            const property = await prisma.property.findUnique({
                where: { id: propertyId }
            });
            if (!property) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
                });
            }
            // Check for booking conflicts
            const conflictingBooking = await prisma.booking.findFirst({
                where: {
                    propertyId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                    OR: [
                        {
                            AND: [
                                { checkIn: { lte: checkInDate } },
                                { checkOut: { gt: checkInDate } }
                            ]
                        },
                        {
                            AND: [
                                { checkIn: { lt: checkOutDate } },
                                { checkOut: { gte: checkOutDate } }
                            ]
                        },
                        {
                            AND: [
                                { checkIn: { gte: checkInDate } },
                                { checkOut: { lte: checkOutDate } }
                            ]
                        }
                    ]
                }
            });
            if (conflictingBooking) {
                return res.status(409).json({
                    success: false,
                    error: { code: 'BOOKING_CONFLICT', message: 'Property is not available for the selected dates' }
                });
            }
            // Create booking
            const booking = await prisma.booking.create({
                data: {
                    userId: tenantId,
                    propertyId,
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    status: 'PENDING'
                },
                include: {
                    property: {
                        include: {
                            owner: { select: { name: true, email: true } }
                        }
                    }
                }
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logBookingCreation(tenantId, propertyId, booking.id, checkInDate, checkOutDate);
            res.status(201).json({
                success: true,
                data: booking
            });
        }
        catch (error) {
            console.error('Booking creation error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking.' }
            });
        }
    }
    /**
     * PUT /api/tenant/bookings/:id
     * Updates an existing booking owned by the authenticated tenant
     */
    static async updateBooking(req, res) {
        try {
            const validation = updateBookingSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const tenantId = req.currentUser.id;
            const bookingId = req.params.id;
            const updates = validation.data;
            // Validate date changes if provided
            if (updates.checkIn && updates.checkOut) {
                const checkInDate = new Date(updates.checkIn);
                const checkOutDate = new Date(updates.checkOut);
                if (checkInDate >= checkOutDate) {
                    return res.status(400).json({
                        success: false,
                        error: { code: 'INVALID_DATES', message: 'Check-out date must be after check-in date' }
                    });
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
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logBookingUpdate(tenantId, bookingId, updates);
            res.status(200).json({
                success: true,
                data: booking
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or you do not own it.' }
                });
            }
            console.error('Booking update error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to update booking.' }
            });
        }
    }
    /**
     * DELETE /api/tenant/bookings/:id
     * Cancels a booking owned by the authenticated tenant
     */
    static async cancelBooking(req, res) {
        try {
            const tenantId = req.currentUser.id;
            const bookingId = req.params.id;
            // Check if booking can be cancelled
            const booking = await prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    userId: tenantId,
                    status: { in: ['PENDING', 'CONFIRMED'] }
                }
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or cannot be cancelled.' }
                });
            }
            // Update booking status to cancelled
            await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' }
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logBookingStatusChange(tenantId, bookingId, booking.status, 'CANCELLED');
            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully'
            });
        }
        catch (error) {
            console.error('Booking cancellation error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel booking.' }
            });
        }
    }
    /**
     * GET /api/tenant/bookings
     * Returns bookings for the authenticated tenant
     */
    static async getTenantBookings(req, res) {
        try {
            const validation = bookingQuerySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const tenantId = req.currentUser.id;
            const { status, page, limit } = validation.data;
            const where = { userId: tenantId };
            if (status) {
                where.status = status;
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
            ]);
            // Calculate average ratings for properties
            const bookingsWithRating = bookings.map(booking => ({
                ...booking,
                property: {
                    ...booking.property,
                    averageRating: booking.property.reviews.length > 0
                        ? booking.property.reviews.reduce((sum, review) => sum + review.rating, 0) / booking.property.reviews.length
                        : null
                }
            }));
            res.status(200).json({
                success: true,
                data: bookingsWithRating,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Tenant bookings fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings.' }
            });
        }
    }
    /**
     * GET /api/tenant/bookings/:id
     * Returns detailed information about a specific booking
     */
    static async getBookingDetails(req, res) {
        try {
            const tenantId = req.currentUser.id;
            const bookingId = req.params.id;
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
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' }
                });
            }
            // Calculate average rating
            const averageRating = booking.property.reviews.length > 0
                ? booking.property.reviews.reduce((sum, review) => sum + review.rating, 0) / booking.property.reviews.length
                : null;
            res.status(200).json({
                success: true,
                data: {
                    ...booking,
                    property: {
                        ...booking.property,
                        averageRating
                    }
                }
            });
        }
        catch (error) {
            console.error('Booking details fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch booking details.' }
            });
        }
    }
    /**
     * GET /api/owner/bookings
     * Returns bookings for properties owned by the authenticated owner
     */
    static async getOwnerBookings(req, res) {
        try {
            const validation = bookingQuerySchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', issues: validation.error.issues }
                });
            }
            const ownerId = req.currentUser.id;
            const { status, page, limit } = validation.data;
            const where = {
                property: { ownerId }
            };
            if (status) {
                where.status = status;
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
            ]);
            res.status(200).json({
                success: true,
                data: bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Owner bookings fetch error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings.' }
            });
        }
    }
    /**
     * PUT /api/owner/bookings/:id/status
     * Updates booking status by the property owner
     */
    static async updateBookingStatus(req, res) {
        try {
            const ownerId = req.currentUser.id;
            const bookingId = req.params.id;
            const { status } = req.body;
            if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_STATUS', message: 'Invalid status. Must be CONFIRMED, CANCELLED, or COMPLETED.' }
                });
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
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or you do not own the property.' }
                });
            }
            // Validate status transition
            const validTransitions = {
                'PENDING': ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED': ['COMPLETED', 'CANCELLED'],
                'CANCELLED': [],
                'COMPLETED': []
            };
            if (!validTransitions[booking.status].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_TRANSITION', message: `Cannot change status from ${booking.status} to ${status}.` }
                });
            }
            // Update booking status
            const updatedBooking = await prisma.booking.update({
                where: { id: bookingId },
                data: { status: status },
                include: {
                    property: {
                        select: { id: true, name: true, address: true }
                    },
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
            // Log audit event
            await audit_logger_js_1.AuditLogger.logBookingStatusChange(ownerId, bookingId, booking.status, status);
            res.status(200).json({
                success: true,
                data: updatedBooking
            });
        }
        catch (error) {
            console.error('Booking status update error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to update booking status.' }
            });
        }
    }
}
exports.BookingsController = BookingsController;
