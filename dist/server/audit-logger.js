"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuditLogger {
    /**
     * Log payment creation event
     */
    static async logPaymentCreation(actorId, bookingId, paymentId, amount) {
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: 'PAYMENT_CREATED',
                details: `Payment created for booking ${bookingId} with amount ₹${amount / 100}`,
                actorId,
                bookingId,
                paymentId
            }
        });
    }
    /**
     * Log tenant payment confirmation
     */
    static async logPaymentConfirmation(actorId, bookingId, paymentId, upiReference) {
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: 'PAYMENT_CONFIRMED',
                details: `Tenant confirmed payment for booking ${bookingId}${upiReference ? ` with UPI reference ${upiReference}` : ''}`,
                actorId,
                bookingId,
                paymentId
            }
        });
    }
    /**
     * Log owner payment verification
     */
    static async logPaymentVerification(actorId, bookingId, paymentId, action, reason) {
        const actionText = action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'refunded';
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: `PAYMENT_${action.toUpperCase()}D`,
                details: `Owner ${actionText} payment for booking ${bookingId}${reason ? `. Reason: ${reason}` : ''}`,
                actorId,
                bookingId,
                paymentId
            }
        });
    }
    /**
     * Log invoice generation
     */
    static async logInvoiceGeneration(actorId, bookingId, paymentId, invoiceId, invoiceNo) {
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: 'INVOICE_GENERATED',
                details: `Invoice ${invoiceNo} generated for booking ${bookingId}`,
                actorId,
                bookingId,
                paymentId
            }
        });
    }
    /**
     * Log booking status change
     */
    static async logBookingStatusChange(actorId, bookingId, oldStatus, newStatus) {
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: 'BOOKING_STATUS_CHANGED',
                details: `Booking ${bookingId} status changed from ${oldStatus} to ${newStatus}`,
                actorId,
                bookingId
            }
        });
    }
    /**
     * Get audit logs for a payment
     */
    static async getPaymentAuditLogs(paymentId) {
        return await prisma.auditLog.findMany({
            where: { paymentId },
            include: {
                actor: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    /**
     * Get audit logs for a booking
     */
    static async getBookingAuditLogs(bookingId) {
        return await prisma.auditLog.findMany({
            where: { bookingId },
            include: {
                actor: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    /**
     * Get audit logs for a user (actor)
     */
    static async getUserAuditLogs(actorId, limit = 50) {
        return await prisma.auditLog.findMany({
            where: { actorId },
            include: {
                actor: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    /**
     * Log user action
     */
    static async logUserAction(userId, action, details, metadata) {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details,
                actorId: userId
            }
        });
    }
    /**
     * Log booking creation
     */
    static async logBookingCreation(tenantId, propertyId, bookingId, checkInDate, checkOutDate) {
        await prisma.auditLog.create({
            data: {
                userId: tenantId,
                action: 'BOOKING_CREATED',
                details: `Booking created for property ${propertyId} from ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`,
                actorId: tenantId,
                bookingId
            }
        });
    }
    /**
     * Log booking update
     */
    static async logBookingUpdate(actorId, bookingId, updates) {
        await prisma.auditLog.create({
            data: {
                userId: actorId,
                action: 'BOOKING_UPDATED',
                details: `Booking ${bookingId} updated: ${JSON.stringify(updates)}`,
                actorId,
                bookingId
            }
        });
    }
    /**
     * Log property creation
     */
    static async logPropertyCreation(ownerId, propertyId, name) {
        await prisma.auditLog.create({
            data: {
                userId: ownerId,
                action: 'PROPERTY_CREATED',
                details: `Property "${name}" created`,
                actorId: ownerId
            }
        });
    }
    /**
     * Log property update
     */
    static async logPropertyUpdate(ownerId, propertyId, updates) {
        await prisma.auditLog.create({
            data: {
                userId: ownerId,
                action: 'PROPERTY_UPDATED',
                details: `Property ${propertyId} updated: ${JSON.stringify(updates)}`,
                actorId: ownerId
            }
        });
    }
    /**
     * Log property deletion
     */
    static async logPropertyDeletion(ownerId, propertyId) {
        await prisma.auditLog.create({
            data: {
                userId: ownerId,
                action: 'PROPERTY_DELETED',
                details: `Property ${propertyId} deleted`,
                actorId: ownerId
            }
        });
    }
}
exports.AuditLogger = AuditLogger;
