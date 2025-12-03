import { Request, Response } from 'express'
import { z } from 'zod'
import QRCode from 'qrcode'
import { PrismaClient, PaymentStatus, BookingStatus } from '@prisma/client'
import { AuditLogger } from '../audit-logger.js'

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

      // 2. Update payment status and booking status.
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'AWAITING_OWNER_VERIFICATION',
          transactionId: upiReference,
          booking: {
            update: {
              status: 'AWAITING_VERIFICATION'
            }
          }
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
              property: { select: { title: true, location: true, address: true, pricePerNight: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Convert amount from paisa to rupees and format dates
      const formattedPayments = pendingPayments.map(payment => ({
        id: payment.id,
        booking_id: payment.bookingId,
        amount: payment.amount / 100, // Convert from paisa to rupees
        currency: 'INR',
        status: payment.status,
        upi_uri: payment.upiQrUri,
        upi_reference: payment.transactionId,
        verified_by: payment.verifiedBy,
        verified_at: payment.verifiedAt?.toISOString(),
        created_at: payment.createdAt.toISOString(),
        booking: {
          check_in: payment.booking.checkIn.toISOString(),
          check_out: payment.booking.checkOut.toISOString(),
          property: {
            name: payment.booking.property.title,
            address: payment.booking.property.address || payment.booking.property.location
          }
        },
        user: payment.booking.user
      }))

      res.status(200).json({ success: true, data: formattedPayments })
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
      const { limit = '10', page = '1', status } = req.query

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
              property: { select: { title: true, location: true, address: true, pricePerNight: true } },
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })

      // Convert amount from paisa to rupees and format dates
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        booking_id: payment.bookingId,
        amount: payment.amount / 100, // Convert from paisa to rupees
        currency: 'INR',
        status: payment.status,
        upi_uri: payment.upiQrUri,
        upi_reference: payment.transactionId,
        verified_by: payment.verifiedBy,
        verified_at: payment.verifiedAt?.toISOString(),
        created_at: payment.createdAt.toISOString(),
        booking: {
          check_in: payment.booking.checkIn.toISOString(),
          check_out: payment.booking.checkOut.toISOString(),
          property: {
            name: payment.booking.property.title,
            address: payment.booking.property.address || payment.booking.property.location
          }
        },
        user: payment.booking.user
      }))

      res.status(200).json({ success: true, data: formattedPayments })
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
      const { limit = '10', page = '1', status } = req.query
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
              property: { select: { title: true, location: true, address: true, pricePerNight: true } },
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Convert amount from paisa to rupees and format dates
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        booking_id: payment.bookingId,
        amount: payment.amount / 100, // Convert from paisa to rupees
        currency: 'INR',
        status: payment.status,
        upi_uri: payment.upiQrUri,
        upi_reference: payment.transactionId,
        verified_by: payment.verifiedBy,
        verified_at: payment.verifiedAt?.toISOString(),
        created_at: payment.createdAt.toISOString(),
        booking: {
          check_in: payment.booking.checkIn.toISOString(),
          check_out: payment.booking.checkOut.toISOString(),
          property: {
            name: payment.booking.property.title,
            address: payment.booking.property.address || payment.booking.property.location
          }
        },
        user: payment.booking.user
      }))

      res.status(200).json({ success: true, data: formattedPayments })
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
      await tx.payment.update({
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
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'paid'
        }
      })

      return {
        paymentId: payment.id,
        status: 'VERIFIED',
        booking: {
          id: payment.bookingId,
          status: 'CONFIRMED',
        },
      }
    }).then(async (result) => {
      // Post-transaction actions
      await AuditLogger.logPaymentVerification(ownerId, result.booking.id, result.paymentId, 'verify')
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
      },
      include: { booking: true }
    })

    await AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, 'reject', note)

    return {
      paymentId: payment.id,
      status: 'REJECTED',
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
            }
          })

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'paid'
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
            status: 'REJECTED',
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