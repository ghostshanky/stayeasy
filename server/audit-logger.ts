import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
        actorId,
        bookingId,
        paymentId
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
        actorId,
        bookingId,
        paymentId
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
        actorId,
        bookingId,
        paymentId
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
        actorId,
        bookingId,
        paymentId
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
        actorId,
        bookingId
      }
    })
  }

  /**
   * Get audit logs for a payment
   */
  static async getPaymentAuditLogs(paymentId: string) {
    return await prisma.auditLog.findMany({
      where: { paymentId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  /**
   * Get audit logs for a booking
   */
  static async getBookingAuditLogs(bookingId: string) {
    return await prisma.auditLog.findMany({
      where: { bookingId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  /**
   * Get audit logs for a user (actor)
   */
  static async getUserAuditLogs(actorId: string, limit: number = 50) {
    return await prisma.auditLog.findMany({
      where: { actorId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Log user action
   */
  static async logUserAction(userId: string, action: string, details: string, metadata?: any) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        actorId: userId
      }
    })
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
        actorId: tenantId,
        bookingId
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
        actorId,
        bookingId
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
        actorId: ownerId
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
        actorId: ownerId
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
        actorId: ownerId
      }
    })
  }
}
