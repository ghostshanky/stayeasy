import { supabaseServer } from './lib/supabaseServer.js'

export class AuditLogger {
  /**
   * Log payment creation event
   */
  static async logPaymentCreation(actorId: string, bookingId: string, paymentId: string, amount: number) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: 'PAYMENT_CREATED',
        details: `Payment created for booking ${bookingId} with amount ₹${amount / 100}`,
        actor_id: actorId,
        booking_id: bookingId,
        payment_id: paymentId
      })
  }

  /**
   * Log tenant payment confirmation
   */
  static async logPaymentConfirmation(actorId: string, bookingId: string, paymentId: string, upiReference?: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: 'PAYMENT_CONFIRMED',
        details: `Tenant confirmed payment for booking ${bookingId}${upiReference ? ` with UPI reference ${upiReference}` : ''}`,
        actor_id: actorId,
        booking_id: bookingId,
        payment_id: paymentId
      })
  }

  /**
   * Log owner payment verification
   */
  static async logPaymentVerification(actorId: string, bookingId: string, paymentId: string, action: 'verify' | 'reject' | 'refund', reason?: string) {
    const actionText = action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'refunded'
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: `PAYMENT_${action.toUpperCase()}D`,
        details: `Owner ${actionText} payment for booking ${bookingId}${reason ? `. Reason: ${reason}` : ''}`,
        actor_id: actorId,
        booking_id: bookingId,
        payment_id: paymentId
      })
  }

  /**
   * Log invoice generation
   */
  static async logInvoiceGeneration(actorId: string, bookingId: string, paymentId: string, invoiceId: string, invoiceNo: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: 'INVOICE_GENERATED',
        details: `Invoice ${invoiceNo} generated for booking ${bookingId}`,
        actor_id: actorId,
        booking_id: bookingId,
        payment_id: paymentId,
        invoice_id: invoiceId
      })
  }

  /**
   * Log booking status change
   */
  static async logBookingStatusChange(actorId: string, bookingId: string, oldStatus: string, newStatus: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: 'BOOKING_STATUS_CHANGED',
        details: `Booking ${bookingId} status changed from ${oldStatus} to ${newStatus}`,
        actor_id: actorId,
        booking_id: bookingId
      })
  }

  /**
   * Get audit logs for a payment
   */
  static async getPaymentAuditLogs(paymentId: string) {
    const { data, error } = await supabaseServer
      .from('audit_logs')
      .select(`
        *,
        actor:users!actor_id (id, name, email, role)
      `)
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Get audit logs for a booking
   */
  static async getBookingAuditLogs(bookingId: string) {
    const { data, error } = await supabaseServer
      .from('audit_logs')
      .select(`
        *,
        actor:users!actor_id (id, name, email, role)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Get audit logs for a user (actor)
   */
  static async getUserAuditLogs(actorId: string, limit: number = 50) {
    const { data, error } = await supabaseServer
      .from('audit_logs')
      .select(`
        *,
        actor:users!actor_id (id, name, email, role)
      `)
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  /**
   * Log user action
   */
  static async logUserAction(userId: string, action: string, details: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details
      })
  }

  /**
   * Log booking creation
   */
  static async logBookingCreation(tenantId: string, propertyId: string, bookingId: string, checkInDate: Date, checkOutDate: Date) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: tenantId,
        action: 'BOOKING_CREATED',
        details: `Booking created for property ${propertyId} from ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`,
        actor_id: tenantId,
        booking_id: bookingId
      })
  }

  /**
   * Log booking update
   */
  static async logBookingUpdate(actorId: string, bookingId: string, updates: any) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: actorId,
        action: 'BOOKING_UPDATED',
        details: `Booking ${bookingId} updated: ${JSON.stringify(updates)}`,
        actor_id: actorId,
        booking_id: bookingId
      })
  }

  /**
   * Log property creation
   */
  static async logPropertyCreation(ownerId: string, propertyId: string, name: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: ownerId,
        action: 'PROPERTY_CREATED',
        details: `Property "${name}" created`,
        actor_id: ownerId
      })
  }

  /**
   * Log property update
   */
  static async logPropertyUpdate(ownerId: string, propertyId: string, updates: any) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: ownerId,
        action: 'PROPERTY_UPDATED',
        details: `Property ${propertyId} updated: ${JSON.stringify(updates)}`,
        actor_id: ownerId
      })
  }

  /**
   * Log property deletion
   */
  static async logPropertyDeletion(ownerId: string, propertyId: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: ownerId,
        action: 'PROPERTY_DELETED',
        details: `Property ${propertyId} deleted`,
        actor_id: ownerId
      })
  }

  /**
   * Log review creation
   */
  static async logReviewCreation(tenantId: string, reviewId: string, rating: number) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: tenantId,
        action: 'REVIEW_CREATED',
        details: `Review created for property with rating ${rating}`,
        actor_id: tenantId,
        review_id: reviewId
      })
  }

  /**
   * Log review update
   */
  static async logReviewUpdate(tenantId: string, propertyId: string, reviewId: string, updates: any) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: tenantId,
        action: 'REVIEW_UPDATED',
        details: `Review ${reviewId} for property ${propertyId} updated: ${JSON.stringify(updates)}`,
        actor_id: tenantId,
        review_id: reviewId
      })
  }

  /**
   * Log review deletion
   */
  static async logReviewDeletion(tenantId: string, propertyId: string, reviewId: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: tenantId,
        action: 'REVIEW_DELETED',
        details: `Review ${reviewId} for property ${propertyId} deleted`,
        actor_id: tenantId,
        review_id: reviewId
      })
  }

  /**
   * Log review moderation
   */
  static async logReviewModeration(adminId: string, reviewId: string, action: string, reason?: string) {
    await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: adminId,
        action: 'REVIEW_MODERATED',
        details: `Review ${reviewId} ${action.toLowerCase()}${reason ? `. Reason: ${reason}` : ''}`,
        actor_id: adminId,
        review_id: reviewId
      })
  }
}
