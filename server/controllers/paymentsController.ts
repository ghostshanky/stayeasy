import { Prisma, PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import QRCode from 'qrcode'
import { AuditLogger } from '../audit-logger.js'
import { generateInvoicePdf } from '../../prisma/pdfGenerator'

const prisma = new PrismaClient()

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

      const result = await prisma.$transaction(async (tx) => {
        // 1. Validate booking exists, belongs to the user, and is in a payable state.
        const booking = await tx.booking.findFirst({
          where: { id: bookingId, userId, status: 'PENDING' },
          include: { property: { include: { owner: true } } },
        })

        if (!booking) {
          throw new Error('BOOKING_NOT_FOUND')
        }

        // 2. Check if a payment has already been initiated.
        const existingPayment = await tx.payment.findFirst({ where: { bookingId, status: { notIn: ['REJECTED', 'CANCELLED'] } } })
        if (existingPayment) {
          throw new Error('PAYMENT_EXISTS')
        }

        // 3. Calculate amount.
        const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))
        const amountInPaisa = validation.data.amount ? validation.data.amount * 100 : Math.round(booking.property.price * nights * 100)

        // 4. Generate UPI URI.
        const ownerUpiId = booking.property.owner.email // Using email as a mock UPI ID
        const upiUri = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(booking.property.owner.name)}&am=${(amountInPaisa / 100).toFixed(2)}&tn=${bookingId}`

        // 5. Create the payment record.
        const payment = await tx.payment.create({
          data: {
            bookingId,
            userId,
            ownerId: booking.property.ownerId,
            amount: amountInPaisa,
            upiUri,
            status: 'AWAITING_PAYMENT',
          },
        })

        // 6. Log the audit event.
        await AuditLogger.logPaymentCreation(userId, bookingId, payment.id, amountInPaisa)

        return { payment, upiUri }
      })

      const qrDataUrl = await QRCode.toDataURL(result.upiUri)

      res.status(201).json({
        success: true,
        data: {
          paymentId: result.payment.id,
          upiUri: result.upiUri,
          qrDataUrl: qrDataUrl,
        },
      })
    } catch (error: any) {
      if (error.message === 'BOOKING_NOT_FOUND') {
        return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment.' } })
      }
      if (error.message === 'PAYMENT_EXISTS') {
        return res.status(409).json({ success: false, error: { code: 'PAYMENT_EXISTS', message: 'A payment for this booking has already been initiated.' } })
      }
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

      const result = await prisma.$transaction(async (tx) => {
        // 1. Find payment and validate ownership and status.
        const payment = await tx.payment.findFirst({
          where: { id: paymentId, userId, status: 'AWAITING_PAYMENT' },
        })

        if (!payment) {
          throw new Error('PAYMENT_NOT_FOUND')
        }

        // 2. Update payment status.
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'AWAITING_OWNER_VERIFICATION',
            upiReference: upiReference,
          },
        })

        // 3. Log audit event.
        await AuditLogger.logPaymentConfirmation(userId, payment.bookingId!, paymentId, upiReference)

        return updatedPayment
      })

      res.status(200).json({
        success: true,
        data: {
          paymentId: result.id,
          status: result.status,
        },
        message: 'Payment submitted for verification.',
      })
    } catch (error: any) {
      if (error.message === 'PAYMENT_NOT_FOUND') {
        return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not in a confirmable state.' } })
      }
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

      const pendingPayments = await prisma.payment.findMany({
        where: {
          ownerId,
          status: 'AWAITING_OWNER_VERIFICATION',
        },
        include: {
          user: { select: { name: true, email: true } },
          booking: { include: { property: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      })

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

      const payments = await prisma.payment.findMany({
        where: { ownerId },
        include: {
          user: { select: { name: true, email: true } },
          booking: {
            include: {
              property: { select: { name: true, address: true } },
              user: { select: { name: true, email: true } }
            }
          },
          invoice: true
        },
        orderBy: { createdAt: 'desc' },
      })

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
      const existingPayment = await prisma.payment.findFirst({
        where: { id: paymentId, ownerId },
        select: { status: true, id: true },
      })

      if (!existingPayment) {
        return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or you do not have permission to verify it.' } })
      }

      if (existingPayment.status === 'VERIFIED' || existingPayment.status === 'REJECTED') {
        return res.status(200).json({ success: true, data: { paymentId: existingPayment.id, status: existingPayment.status }, message: `Payment was already ${existingPayment.status.toLowerCase()}.` })
      }

      if (existingPayment.status !== 'AWAITING_OWNER_VERIFICATION') {
        return res.status(409).json({ success: false, error: { code: 'INVALID_STATE', message: `Payment is not awaiting verification. Current status: ${existingPayment.status}` } })
      }

      // Main transactional logic
      const result = await prisma.$transaction(async (tx) => {
        if (verified) {
          return PaymentsController.handleVerification(tx, paymentId, ownerId)
        } else {
          return PaymentsController.handleRejection(tx, paymentId, ownerId, note)
        }
      })

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

  private static async handleVerification(tx: Prisma.TransactionClient, paymentId: string, ownerId: string) {
    // 1. Update Payment status
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'VERIFIED',
        verifiedBy: ownerId,
        verifiedAt: new Date(),
      },
      include: { booking: true }
    })

    if (!payment.bookingId) {
      throw new Error('Booking ID missing on payment record.')
    }

    // 2. Update Booking status
    const booking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
    })

    // 3. Create Invoice
    const invoiceNo = `INV-${Date.now()}-${payment.id.slice(-6).toUpperCase()}`
    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        ownerId: payment.ownerId,
        amount: payment.amount,
        status: 'PAID',
        lineItems: [{
          description: `Accommodation for booking ${payment.bookingId}`,
          amount: payment.amount
        }],
        details: `Payment verified for booking ${payment.bookingId}`
      },
    })

    // 4. Generate and link PDF (outside of DB transaction but logically part of the flow)
    // In a real-world scenario, this might be offloaded to a background job.
    const pdfFileId = await generateInvoicePdf(invoice.id)
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { pdfFileId },
    })

    // 5. Log audit events
    await AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, 'verify')
    await AuditLogger.logInvoiceGeneration(ownerId, payment.bookingId, paymentId, invoice.id, invoiceNo)
    await AuditLogger.logBookingStatusChange(ownerId, payment.bookingId, 'PENDING', 'CONFIRMED')

    return {
      paymentId: payment.id,
      status: payment.status,
      invoice: {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
      },
      booking: {
        id: booking.id,
        status: booking.status,
      },
    }
  }

  private static async handleRejection(tx: Prisma.TransactionClient, paymentId: string, ownerId: string, note?: string) {
    // 1. Update Payment status
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        verifiedBy: ownerId,
        verifiedAt: new Date(),
        rejectionReason: note,
      },
      select: { id: true, status: true, bookingId: true }
    })

    // 2. Log audit event
    await AuditLogger.logPaymentVerification(ownerId, payment.bookingId!, paymentId, 'reject', note)

    return {
      paymentId: payment.id,
      status: payment.status,
      invoice: null,
      booking: null,
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