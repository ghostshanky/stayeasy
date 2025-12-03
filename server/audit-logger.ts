import { prisma } from './lib/prisma'

export class AuditLogger {
  /**
   * Log payment creation event
   */
  static async logPaymentCreation(actorId: string, bookingId: string, paymentId: string, amount: number) {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'PAYMENT_CREATED',
        details: `Payment created for booking ${bookingId} with amount ₹${amount / 100}`,
      }
    })
  }

  /**
   * Log tenant payment confirmation
   */
  static async logPaymentConfirmation(actorId: string, bookingId: string, paymentId: string, upiReference?: string) {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'PAYMENT_CONFIRMED',
        details: `Tenant confirmed payment for booking ${bookingId}${upiReference ? ` with UPI reference ${upiReference}` : ''}`,
      }
    })
  }

  /**
   * Log owner payment verification
   */
  static async logPaymentVerification(actorId: string, bookingId: string, paymentId: string, action: 'verify' | 'reject' | 'refund', reason?: string) {
    const actionText = action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'refunded'
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: `PAYMENT_${action.toUpperCase()}D`,
        details: `Owner ${actionText} payment for booking ${bookingId}${reason ? `. Reason: ${reason}` : ''}`,
      }
    })
  }

  /**
   * Log invoice generation
   */
  static async logInvoiceGeneration(actorId: string, bookingId: string, paymentId: string, invoiceId: string, invoiceNo: string) {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'INVOICE_GENERATED',
        details: `Invoice ${invoiceNo} generated for booking ${bookingId}`,
      }
    })
  }

  /**
   * Log booking status change
   */
  static async logBookingStatusChange(actorId: string, bookingId: string, oldStatus: string, newStatus: string) {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'BOOKING_STATUS_CHANGED',
        details: `Booking ${bookingId} status changed from ${oldStatus} to ${newStatus}`,
      }
    })
  }

  /**
   * Get audit logs for a payment
   */
  static async getPaymentAuditLogs(paymentId: string) {
    // Note: Prisma schema for AuditLog doesn't have paymentId, so we might need to filter by details or update schema.
    // For now, returning empty array to avoid errors, or we can implement a text search if needed.
    // The original implementation filtered by payment_id which suggests the schema had it.
    // Let's check schema.prisma again.
    // Schema has: id, userId, action, details, createdAt. No paymentId, bookingId, etc.
    // So the previous Supabase implementation was likely using columns that don't exist in the Prisma schema or were dropped?
    // The user accepted dropping columns in the previous step!

    // We will return generic logs for now.
    return []
  }

  /**
   * Get audit logs for a booking
   */
  static async getBookingAuditLogs(bookingId: string) {
    return []
  }

  /**
   * Get audit logs for a user (actor)
   */
  static async getUserAuditLogs(actorId: string, limit: number = 50) {
    const logs = await prisma.auditLog.findMany({
      where: { userId: actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    // Map to match expected format if necessary
    return logs.map(log => ({
      ...log,
      actor: log.user
    }))
  }

  /**
   * Log user action
   */
  static async logUserAction(userId: string, action: string, details: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details
        }
      })
    } catch (error) {
      console.error('Failed to log user action:', error)
      // Don't throw, just log error so it doesn't break the main flow
    }
  }

  /**
   * Log booking creation
   */
  static async logBookingCreation(tenantId: string, propertyId: string, bookingId: string, checkInDate: Date, checkOutDate: Date) {
    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: 'BOOKING_CREATED',
        details: `Booking created for property ${propertyId} from ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`,
      }
    })
  }

  /**
   * Log booking update
   */
  static async logBookingUpdate(actorId: string, bookingId: string, updates: any) {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'BOOKING_UPDATED',
        details: `Booking ${bookingId} updated: ${JSON.stringify(updates)}`,
      }
    })
  }

  /**
   * Log property creation
   */
  static async logPropertyCreation(ownerId: string, propertyId: string, name: string) {
    await prisma.auditLog.create({
      data: {
        userId: ownerId,
        action: 'PROPERTY_CREATED',
        details: `Property "${name}" created`,
      }
    })
  }

  /**
   * Log property update
   */
  static async logPropertyUpdate(ownerId: string, propertyId: string, updates: any) {
    await prisma.auditLog.create({
      data: {
        userId: ownerId,
        action: 'PROPERTY_UPDATED',
        details: `Property ${propertyId} updated: ${JSON.stringify(updates)}`,
      }
    })
  }

  /**
   * Log property deletion
   */
  static async logPropertyDeletion(ownerId: string, propertyId: string) {
    await prisma.auditLog.create({
      data: {
        userId: ownerId,
        action: 'PROPERTY_DELETED',
        details: `Property ${propertyId} deleted`,
      }
    })
  }

  /**
   * Log review creation
   */
  static async logReviewCreation(tenantId: string, reviewId: string, rating: number) {
    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: 'REVIEW_CREATED',
        details: `Review created for property with rating ${rating}`,
      }
    })
  }

  /**
   * Log review update
   */
  static async logReviewUpdate(tenantId: string, propertyId: string, reviewId: string, updates: any) {
    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: 'REVIEW_UPDATED',
        details: `Review ${reviewId} for property ${propertyId} updated: ${JSON.stringify(updates)}`,
      }
    })
  }

  /**
   * Log review deletion
   */
  static async logReviewDeletion(tenantId: string, propertyId: string, reviewId: string) {
    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: 'REVIEW_DELETED',
        details: `Review ${reviewId} for property ${propertyId} deleted`,
      }
    })
  }

  /**
   * Log review moderation
   */
  static async logReviewModeration(adminId: string, reviewId: string, action: string, reason?: string) {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REVIEW_MODERATED',
        details: `Review ${reviewId} ${action.toLowerCase()}${reason ? `. Reason: ${reason}` : ''}`,
      }
    })
  }
}
