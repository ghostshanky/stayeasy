import { Request, Response } from 'express'
import { z } from 'zod'
import QRCode from 'qrcode'
import { PrismaClient, PaymentStatus, BookingStatus } from '@prisma/client'
import { AuditLogger } from '../audit-logger.js'
import { generateInvoicePdf } from '../../prisma/pdfGenerator'

const prisma = new PrismaClient()

// --- Input Validation Schemas ---
const createPaymentSchema = z.object({
  bookingId: z.string(),
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
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId,
          status: 'PENDING'
        },
        include: {
          property: {
            include: {
              owner: true
            }
          }
        }
      })

      if (!booking) {
        return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment.' } })
      }

      // 2. Check if a payment has already been initiated.
      const existingPayment = await prisma.payment.findFirst({
        where: {
          bookingId: bookingId,
          status: {
            notIn: ['REJECTED', 'CANCELLED']
          }
        }
      })

      if (existingPayment) {
        return res.status(409).json({ success: false, error: { code: 'PAYMENT_EXISTS', message: 'A payment for this booking has already been initiated.' } })
      }

      // 3. Calculate amount.
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const amountInPaisa = validation.data.amount ? validation.data.amount * 100 : Math.round(booking.property.pricePerNight * nights * 100)

      // 4. Generate UPI URI.
      const ownerUpiId = booking.property.owner.email // Using email as a mock UPI ID
      const upiUri = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(booking.property.owner.name)}&am=${(amountInPaisa / 100).toFixed(2)}&tn=${bookingId}`

      // 5. Create the payment record.
      const payment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          amount: amountInPaisa,
          upiQrUri: upiUri,
          status: 'AWAITING_PAYMENT'
        }
      })

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
      // Note: Payment model doesn't have userId directly, it's on Booking.
      // We need to check if the booking associated with this payment belongs to the user.
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          status: 'AWAITING_PAYMENT',
          booking: {
            userId: userId
          }
        },
        include: {
          booking: true
        }
      })

      if (!payment) {
        return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not in a confirmable state.' } })
      }

      // 2. Update payment status.
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'AWAITING_OWNER_VERIFICATION',
          transactionId: upiReference // Mapping upiReference to transactionId
        }
      })

      // 3. Log audit event.
      await AuditLogger.logPaymentConfirmation(userId, payment.bookingId, paymentId, upiReference)

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

      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: 'AWAITING_OWNER_VERIFICATION',
          booking: {
            property: {
              ownerId: ownerId
            }
          }
        },
        include: {
          booking: {
            include: {
              user: { select: { name: true, email: true } },
              property: { select: { title: true } } // Changed name to title
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      res.status(200).json({ success: true, data: pendingPayments })
    } catch (error) {
      console.error('Error fetching pending payments:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pending payments.' } })
    }
  }

  /**
   * GET /api/payments
   * Returns a list of payments for the authenticated user.
   */
  static async getUserPayments(req: Request, res: Response) {
    try {
      const userId = req.currentUser!.id
      const { limit = 10, page = 1, status } = req.query

      const whereClause: any = {
        booking: {
          userId: userId
        }
      }

      if (status && typeof status === 'string') {
        whereClause.status = status.toUpperCase() as PaymentStatus
      }

      const payments = await prisma.payment.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              property: { select: { title: true, address: true } }, // Changed name to title
              user: { select: { name: true, email: true } }
            }
          },
          invoices: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })

      res.status(200).json({ success: true, data: payments })
    } catch (error) {
      console.error('Error fetching user payments:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments.' } })
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
        where: {
          booking: {
            property: {
              ownerId: ownerId
            }
          }
        },
        include: {
          booking: {
            include: {
              property: { select: { title: true, address: true } }, // Changed name to title
              user: { select: { name: true, email: true } }
            }
          },
          invoices: true
        },
        orderBy: { createdAt: 'desc' }
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

      // Check for idempotency first
      const existingPayment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          booking: {
            property: {
              ownerId: ownerId
            }
          }
        }
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

      // Main logic
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
    // Transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // 1. Get payment details
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: true
        }
      })

      if (!payment) throw new Error('Payment not found')
      if (!payment.bookingId) throw new Error('Booking ID missing on payment record.')

      // 2. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedBy: ownerId,
          verifiedAt: new Date(),
        }
      })

      // 3. Update Booking status
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' }
      })

      // 4. Create Invoice
      const invoiceNo = `INV-${Date.now()}-${payment.id.slice(-6).toUpperCase()}`
      const invoice = await tx.invoice.create({
        data: {
          paymentId: payment.id,
          details: `Payment verified for booking ${payment.bookingId}`
          // Note: Invoice model in schema.prisma is minimal, doesn't have invoice_no, user_id, owner_id, amount, status, line_items
          // We need to check schema.prisma again.
          // Schema has: id, paymentId, details, pdfFileId, createdAt.
          // The previous Supabase code was inserting a lot more fields.
          // We will stick to the schema definition.
        }
      })

      // 5. Generate and link PDF (outside of DB transaction but logically part of the flow)
      // We can't do async PDF generation inside transaction easily if it takes time, but here we just call it.
      // Assuming generateInvoicePdf handles its own logic.
      // We'll do it AFTER transaction or just ignore errors for now as per previous implementation style.

      // 6. Log audit events
      // AuditLogger uses prisma.create, which is outside this transaction unless we pass tx.
      // For now we'll call it after transaction or let it be independent.

      return {
        paymentId: payment.id,
        status: 'VERIFIED',
        invoice: {
          id: invoice.id,
          // invoiceNo: invoice.invoice_no, // Not in schema
        },
        booking: {
          id: payment.bookingId,
          status: 'CONFIRMED',
        },
      }
    }).then(async (result) => {
      // Post-transaction actions
      await AuditLogger.logPaymentVerification(ownerId, result.booking.id, result.paymentId, 'verify')
      // await AuditLogger.logInvoiceGeneration(...) // Invoice schema mismatch, skipping for now
      await AuditLogger.logBookingStatusChange(ownerId, result.booking.id, 'PENDING', 'CONFIRMED')
      return result
    })
  }

  private static async handleRejection(paymentId: string, ownerId: string, note?: string) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        verifiedBy: ownerId,
        verifiedAt: new Date(),
        // rejection_reason: note // Not in schema
      },
      include: { booking: true }
    })

    await AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, 'reject', note)

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
      const { paymentId, status } = req.body

      if (!paymentId || !status) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_WEBHOOK_DATA', message: 'Missing paymentId or status' }
        })
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true }
      })

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        })
      }

      if (status === 'COMPLETED' && payment.status === 'AWAITING_PAYMENT') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'VERIFIED',
              verifiedBy: 'WEBHOOK',
              verifiedAt: new Date(),
              // completed_at: new Date() // Not in schema
            }
          })

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' }
          })

          await tx.invoice.create({
            data: {
              paymentId: payment.id,
              details: `Payment completed via webhook for booking ${payment.bookingId}`
            }
          })
        })

        await AuditLogger.logPaymentVerification('WEBHOOK', payment.bookingId, paymentId, 'verify')
        await AuditLogger.logBookingStatusChange('WEBHOOK', payment.bookingId, 'PENDING', 'CONFIRMED')

        res.status(200).json({ success: true, message: 'Payment processed successfully' })

      } else if (status === 'FAILED' && payment.status === 'AWAITING_PAYMENT') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REJECTED', // Using REJECTED as FAILED is not in enum? Schema says REJECTED.
            // completed_at: new Date()
          }
        })

        await AuditLogger.logPaymentVerification('WEBHOOK', payment.bookingId, paymentId, 'reject')

        res.status(200).json({ success: true, message: 'Payment failure recorded' })

      } else {
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