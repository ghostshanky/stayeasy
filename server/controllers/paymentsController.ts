import { Request, Response } from 'express'
import { z } from 'zod'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase.js'
import { AuditLogger } from '../audit-logger.js'
import { generateInvoicePdf } from '../../prisma/pdfGenerator'

// --- Input Validation Schemas ---
const createPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().int().positive().optional(),
})

const confirmPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  upiReference: z.string().min(1).max(50).optional(),
})

const verifyPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  verified: z.boolean(),
  note: z.string().min(1).max(255).optional(),
})

export class PaymentsController {
  /**
   * POST /api/payments/create
   * Creates a payment record for a booking and generates a UPI URI.
   */
  static async createPayment(req: Request, res: Response) {
    try {
      const validation = createPaymentSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', issues: validation.error.issues } })
      }

      const { bookingId } = validation.data
      const userId = req.currentUser!.id

      // 1. Validate booking exists, belongs to the user, and is in a payable state.
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(
            *,
            owner:users(*)
          )
        `)
        .eq('id', bookingId)
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .single()

      if (bookingError || !booking) {
        return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment.' } })
      }

      // 2. Check if a payment has already been initiated.
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('booking_id', bookingId)
        .not('status', 'in', '("REJECTED","CANCELLED")')
        .single()

      if (existingPayment) {
        return res.status(409).json({ success: false, error: { code: 'PAYMENT_EXISTS', message: 'A payment for this booking has already been initiated.' } })
      }

      // 3. Calculate amount.
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const amountInPaisa = validation.data.amount ? validation.data.amount * 100 : Math.round(booking.property.price * nights * 100)

      // 4. Generate UPI URI.
      const ownerUpiId = booking.property.owner.email // Using email as a mock UPI ID
      const upiUri = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(booking.property.owner.name)}&am=${(amountInPaisa / 100).toFixed(2)}&tn=${bookingId}`

      // 5. Create the payment record.
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          owner_id: booking.property.owner_id,
          amount: amountInPaisa,
          upi_uri: upiUri,
          status: 'AWAITING_PAYMENT',
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Payment creation error:', paymentError)
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment.' } })
      }

      // 6. Log the audit event.
      await AuditLogger.logPaymentCreation(userId, bookingId, payment.id, amountInPaisa)

      const qrDataUrl = await QRCode.toDataURL(upiUri)

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment.id,
          upiUri: upiUri,
          qrDataUrl: qrDataUrl,
        },
      })
    } catch (error: any) {
      console.error('Payment creation error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment.' } })
    }
  }

  /**
   * POST /api/payments/confirm
   * Tenant confirms they have made the payment.
   */
  static async confirmPayment(req: Request, res: Response) {
    try {
      const validation = confirmPaymentSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', issues: validation.error.issues } })
      }

      const { paymentId, upiReference } = validation.data
      const userId = req.currentUser!.id

      // 1. Find payment and validate ownership and status.
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .eq('status', 'AWAITING_PAYMENT')
        .single()

      if (paymentError || !payment) {
        return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not in a confirmable state.' } })
      }

      // 2. Update payment status.
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'AWAITING_OWNER_VERIFICATION',
          upi_reference: upiReference,
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (updateError) {
        console.error('Payment update error:', updateError)
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm payment.' } })
      }

      // 3. Log audit event.
      await AuditLogger.logPaymentConfirmation(userId, payment.booking_id, paymentId, upiReference)

      res.status(200).json({
        success: true,
        data: {
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
        },
        message: 'Payment submitted for verification.',
      })
    } catch (error: any) {
      console.error('Payment confirmation error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm payment.' } })
    }
  }

  /**
   * GET /api/payments/pending
   * Returns a list of payments awaiting verification for the authenticated owner.
   */
  static async getPendingPayments(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id

      const { data: pendingPayments, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:users(name, email),
          booking:bookings(
            *,
            property:properties(name)
          )
        `)
        .eq('owner_id', ownerId)
        .eq('status', 'AWAITING_OWNER_VERIFICATION')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching pending payments:', error)
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pending payments.' } })
      }

      res.status(200).json({ success: true, data: pendingPayments })
    } catch (error) {
      console.error('Error fetching pending payments:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pending payments.' } })
    }
  }

  /**
   * GET /api/payments/owner/:ownerId
   * Returns a list of all payments for the specified owner (only accessible by the owner themselves).
   */
  static async getOwnerPayments(req: Request, res: Response) {
    try {
      const { ownerId } = req.params
      const currentUserId = req.currentUser!.id

      // Ensure only the owner can access their own payments
      if (ownerId !== currentUserId) {
        return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'You can only view your own payments.' } })
      }

      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:users(name, email),
          booking:bookings(
            *,
            property:properties(name, address),
            user:users(name, email)
          ),
          invoice:invoices(*)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching owner payments:', error)
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch owner payments.' } })
      }

      res.status(200).json({ success: true, data: payments })
    } catch (error) {
      console.error('Error fetching owner payments:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch owner payments.' } })
    }
  }

  /**
   * POST /api/payments/verify
   * Owner verifies or rejects a payment.
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const validation = verifyPaymentSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', issues: validation.error.issues } })
      }

      const { paymentId, verified, note } = validation.data
      const ownerId = req.currentUser!.id

      // Check for idempotency first, outside the transaction
      const { data: existingPayment, error: paymentError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('id', paymentId)
        .eq('owner_id', ownerId)
        .single()

      if (paymentError || !existingPayment) {
        return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or you do not have permission to verify it.' } })
      }

      if (existingPayment.status === 'VERIFIED' || existingPayment.status === 'REJECTED') {
        return res.status(200).json({ success: true, data: { paymentId: existingPayment.id, status: existingPayment.status }, message: `Payment was already ${existingPayment.status.toLowerCase()}.` })
      }

      if (existingPayment.status !== 'AWAITING_OWNER_VERIFICATION') {
        return res.status(409).json({ success: false, error: { code: 'INVALID_STATE', message: `Payment is not awaiting verification. Current status: ${existingPayment.status}` } })
      }

      // Main logic (Supabase doesn't support transactions like Prisma, so handle sequentially)
      const result = verified
        ? await PaymentsController.handleVerification(paymentId, ownerId)
        : await PaymentsController.handleRejection(paymentId, ownerId, note)

      res.status(200).json({
        success: true,
        data: result,
        message: `Payment successfully ${verified ? 'verified' : 'rejected'}.`,
      })

    } catch (error: any) {
      console.error('Payment verification error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify payment.' } })
    }
  }

  private static async handleVerification(paymentId: string, ownerId: string) {
    // 1. Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment not found')
    }

    if (!payment.booking_id) {
      throw new Error('Booking ID missing on payment record.')
    }

    // 2. Update Payment status
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'VERIFIED',
        verified_by: ownerId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (updatePaymentError) {
      throw new Error('Failed to update payment status')
    }

    // 3. Update Booking status
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({ status: 'CONFIRMED' })
      .eq('id', payment.booking_id)

    if (updateBookingError) {
      throw new Error('Failed to update booking status')
    }

    // 4. Create Invoice
    const invoiceNo = `INV-${Date.now()}-${payment.id.slice(-6).toUpperCase()}`
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_no: invoiceNo,
        payment_id: payment.id,
        booking_id: payment.booking_id,
        user_id: payment.user_id,
        owner_id: payment.owner_id,
        amount: payment.amount,
        status: 'PAID',
        line_items: [{
          description: `Accommodation for booking ${payment.booking_id}`,
          amount: payment.amount
        }],
        details: `Payment verified for booking ${payment.booking_id}`
      })
      .select()
      .single()

    if (invoiceError) {
      throw new Error('Failed to create invoice')
    }

    // 5. Generate and link PDF (outside of DB transaction but logically part of the flow)
    // In a real-world scenario, this might be offloaded to a background job.
    const pdfFileId = await generateInvoicePdf(invoice.id)
    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({ pdf_file_id: pdfFileId })
      .eq('id', invoice.id)

    if (updateInvoiceError) {
      console.error('Failed to update invoice with PDF file ID:', updateInvoiceError)
    }

    // 6. Log audit events
    await AuditLogger.logPaymentVerification(ownerId, payment.booking_id, paymentId, 'verify')
    await AuditLogger.logInvoiceGeneration(ownerId, payment.booking_id, paymentId, invoice.id, invoiceNo)
    await AuditLogger.logBookingStatusChange(ownerId, payment.booking_id, 'PENDING', 'CONFIRMED')

    return {
      paymentId: payment.id,
      status: 'VERIFIED',
      invoice: {
        id: invoice.id,
        invoiceNo: invoice.invoice_no,
      },
      booking: {
        id: payment.booking_id,
        status: 'CONFIRMED',
      },
    }
  }

  private static async handleRejection(paymentId: string, ownerId: string, note?: string) {
    // 1. Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment not found')
    }

    // 2. Update Payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'REJECTED',
        verified_by: ownerId,
        verified_at: new Date().toISOString(),
        rejection_reason: note,
      })
      .eq('id', paymentId)

    if (updateError) {
      throw new Error('Failed to update payment status')
    }

    // 3. Log audit event
    await AuditLogger.logPaymentVerification(ownerId, payment.booking_id!, paymentId, 'reject', note)

    return {
      paymentId: payment.id,
      status: 'REJECTED',
      invoice: null,
      booking: null,
    }
  }

  /**
   * POST /api/payments/webhook
   * Handles payment webhooks from external payment providers
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const { paymentId, status, details } = req.body

      // Validate webhook signature (implementation depends on payment provider)
      // For now, we'll assume the webhook is authenticated

      if (!paymentId || !status) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_WEBHOOK_DATA', message: 'Missing paymentId or status' }
        })
      }

      // Find the payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (paymentError || !payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        })
      }

      // Handle different webhook statuses
      if (status === 'COMPLETED' && payment.status === 'AWAITING_PAYMENT') {
        // Payment was successful
        // Update payment status
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update({
            status: 'VERIFIED',
            verified_by: 'WEBHOOK',
            verified_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq('id', paymentId)

        if (updatePaymentError) {
          throw new Error('Failed to update payment status')
        }

        // Update booking status
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ status: 'CONFIRMED' })
          .eq('id', payment.booking_id!)

        if (updateBookingError) {
          throw new Error('Failed to update booking status')
        }

        // Create invoice
        const invoiceNo = `INV-${Date.now()}-${paymentId.slice(-6).toUpperCase()}`
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_no: invoiceNo,
            payment_id: paymentId,
            booking_id: payment.booking_id,
            user_id: payment.user_id,
            owner_id: payment.owner_id,
            amount: payment.amount,
            status: 'PAID',
            line_items: [{
              description: `Accommodation for booking ${payment.booking_id}`,
              amount: payment.amount
            }],
            details: `Payment completed via webhook for booking ${payment.booking_id}`
          })
          .select()
          .single()

        if (invoiceError) {
          throw new Error('Failed to create invoice')
        }

        // Generate PDF
        const pdfFileId = await generateInvoicePdf(invoice.id)
        const { error: updateInvoiceError } = await supabase
          .from('invoices')
          .update({ pdf_file_id: pdfFileId })
          .eq('id', invoice.id)

        if (updateInvoiceError) {
          console.error('Failed to update invoice with PDF file ID:', updateInvoiceError)
        }

        // Log audit events
        await AuditLogger.logPaymentVerification('WEBHOOK', payment.booking_id, paymentId, 'verify')
        await AuditLogger.logInvoiceGeneration('WEBHOOK', payment.booking_id, paymentId, invoice.id, invoiceNo)
        await AuditLogger.logBookingStatusChange('WEBHOOK', payment.booking_id, 'PENDING', 'CONFIRMED')

        res.status(200).json({ success: true, message: 'Payment processed successfully' })

      } else if (status === 'FAILED' && payment.status === 'AWAITING_PAYMENT') {
        // Payment failed
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'FAILED',
            completed_at: new Date().toISOString()
          })
          .eq('id', paymentId)

        if (updateError) {
          throw new Error('Failed to update payment status')
        }

        // Log audit event
        await AuditLogger.logPaymentVerification('WEBHOOK', payment.booking_id!, paymentId, 'reject')

        res.status(200).json({ success: true, message: 'Payment failure recorded' })

      } else {
        // Status update not applicable
        res.status(200).json({ success: true, message: 'Webhook received but no action taken' })
      }

    } catch (error: any) {
      console.error('Webhook processing error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'WEBHOOK_PROCESSING_ERROR', message: 'Failed to process webhook' }
      })
    }
  }
}

/**
 * Creates payment routes with authentication and rate limiting.
 */
import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import rateLimit from 'express-rate-limit'

const paymentRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

paymentRoutes.post(
  '/create',
  paymentLimiter,
  requireAuth,
  PaymentsController.createPayment
)

paymentRoutes.post(
  '/confirm',
  paymentLimiter,
  requireAuth,
  PaymentsController.confirmPayment
)

paymentRoutes.get(
  '/pending',
  requireAuth,
  requireRole(['OWNER']),
  PaymentsController.getPendingPayments
)

paymentRoutes.post(
  '/verify',
  paymentLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PaymentsController.verifyPayment
)

export default paymentRoutes