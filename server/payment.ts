
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';
import { generateInvoicePdf } from '../prisma/pdfGenerator';
import { AuditLogger } from './audit-logger';

// Enum values from Prisma schema
enum PaymentStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  AWAITING_OWNER_VERIFICATION = 'AWAITING_OWNER_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}
import { 
  createPaymentSchema, 
  confirmPaymentSchema, 
  verifyPaymentSchema, 
  refundPaymentSchema,
  getPaymentSchema,
  getPaymentsByBookingSchema,
  getOwnerPaymentsSchema,
  getTenantPaymentsSchema,
  getPaymentAuditLogsSchema,
  getBookingAuditLogsSchema,
  CreatePaymentInput,
  ConfirmPaymentInput,
  VerifyPaymentInput,
  RefundPaymentInput,
  GetPaymentInput,
  GetPaymentsByBookingInput,
  GetOwnerPaymentsInput,
  GetTenantPaymentsInput,
  GetPaymentAuditLogsInput,
  GetBookingAuditLogsInput
} from './validations/payment';

const prisma = new PrismaClient();

// UPI Payment utilities
export class UPIPaymentUtils {
  /**
   * Generate UPI payment URI
   * Format: upi://pay?pa=merchant@upi&pn=PayeeName&am=Amount&tn=TransactionNote
   */
  static generateUPIPaymentURI(params: {
    payeeUPI: string
    payeeName: string
    amount: number
    transactionNote: string
  }): string {
    const { payeeUPI, payeeName, amount, transactionNote } = params;

    // UPI URI format
    const uri = new URL('upi://pay');
    uri.searchParams.set('pa', payeeUPI); // Payee UPI ID
    uri.searchParams.set('pn', payeeName); // Payee Name
    uri.searchParams.set('am', amount.toString()); // Amount
    uri.searchParams.set('tn', transactionNote); // Transaction Note
    uri.searchParams.set('cu', 'INR'); // Currency

    return uri.toString();
  }

  /**
   * Generate QR Code as data URL
   */
  static async generateQRCodeData(upiUri: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(upiUri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      return upiUri; // Fallback to URI
    }
  }

  /**
   * Generate unique invoice number
   */
  static generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Calculate booking amount
   */
  static calculateBookingAmount(booking: any): number {
    const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(booking.property.price * nights * 100); // Convert to paisa
  }
}

// Payment Controller
export const PaymentController = {
  /**
   * POST /api/payments/create
   * Create payment record and generate UPI URI
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = createPaymentSchema.parse(req.body);
      const { bookingId, amount, upiId, merchantName } = validatedData;

      // Validate booking exists and belongs to user
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId,
          status: BookingStatus.PENDING, // Only allow payment for pending bookings
        },
        include: {
          property: {
            include: { owner: true }
          }
        }
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment' }
        });
        return;
      }

      // Check if payment already exists
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId }
      });

      if (existingPayment) {
        res.status(400).json({
          success: false,
          error: { code: 'PAYMENT_EXISTS', message: 'Payment already initiated for this booking' }
        });
        return;
      }

      // Calculate amount if not provided
      const finalAmount = amount || UPIPaymentUtils.calculateBookingAmount(booking);

      // Generate UPI URI
      const upiUri = UPIPaymentUtils.generateUPIPaymentURI({
        payeeUPI: booking.property.owner.email, // Using email as UPI ID for demo
        payeeName: booking.property.owner.name,
        amount: finalAmount / 100, // Convert from paisa to rupees
        transactionNote: `StayEasy Booking ${bookingId}`
      });

      // Generate QR Code
      const qrCode = await UPIPaymentUtils.generateQRCodeData(upiUri);

      // Create payment record
      const paymentData: any = {
        bookingId,
        userId: userId,
        ownerId: booking.property.ownerId,
        amount: finalAmount,
        currency: 'INR',
        upiUri,
        status: PaymentStatus.AWAITING_PAYMENT
      };
      
      const payment = await prisma.payment.create({
        data: paymentData
      });

      // Log payment creation
      await AuditLogger.logPaymentCreation(userId, bookingId, payment.id, finalAmount);

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment.id,
          bookingId,
          amount: payment.amount,
          currency: (payment as any).currency,
          upiUri: (payment as any).upiUri,
          status: payment.status,
          createdAt: payment.createdAt
        }
      });

    } catch (error) {
      console.error('Error creating payment:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'PAYMENT_CREATION_FAILED', message: 'Failed to create payment' }
        });
      }
    }
  },

  /**
   * POST /api/payments/confirm
   * Tenant confirms payment is made
   */
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = confirmPaymentSchema.parse(req.body);
      const { paymentId, transactionId, upiReference } = validatedData;

      // Find and validate payment
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId, // Uncommenting this line
          status: PaymentStatus.AWAITING_PAYMENT
        }
      } as any);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for confirmation' }
        });
        return;
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.AWAITING_OWNER_VERIFICATION,
          upiReference: upiReference || null, // Uncommenting this line
          updatedAt: new Date()
        }
      } as any);

      // Log payment confirmation
      await AuditLogger.logPaymentConfirmation(userId, payment.bookingId!, paymentId, upiReference);

      res.status(200).json({
        success: true,
        data: {
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
          upiReference: updatedPayment.upiReference, // Uncommenting this line
          updatedAt: updatedPayment.updatedAt // Uncommenting this line
        },
        message: 'Payment confirmation submitted. Waiting for owner verification.'
      });

    } catch (error) {
      console.error('Error confirming payment:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'PAYMENT_CONFIRMATION_FAILED', message: 'Failed to confirm payment' }
        });
      }
    }
  },

  /**
   * POST /api/payments/verify
   * Owner verifies or rejects payment
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.currentUser?.id;
      if (!ownerId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = verifyPaymentSchema.parse(req.body);
      const { paymentId, action, reason } = validatedData;

      // Find and validate payment
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          ownerId,
          status: PaymentStatus.AWAITING_OWNER_VERIFICATION
        },
        include: {
          booking: {
            include: {
              property: true,
              user: true
            }
          },
          user: true
        }
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for verification' }
        });
        return;
      }

      const newStatus = action === 'verify' ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED;

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          verifiedAt: new Date(),
          updatedAt: new Date(),
          rejectionReason: action === 'reject' ? reason : null
        }
      } as any);

      let invoice = null;
      let bookingUpdate = null;

      if (action === 'verify') {
        // Generate invoice
        const invoiceNo = UPIPaymentUtils.generateInvoiceNumber();

        const lineItems = [
          {
            description: `Accommodation at ${(payment as any).booking?.property?.name}`,
            amount: payment.amount,
            quantity: 1
          }
        ];

        invoice = await prisma.invoice.create({
          data: {
            invoiceNo, // Uncommenting this line
            bookingId: payment.bookingId,
            paymentId: payment.id,
            userId: payment.userId, // Uncommenting this line
            ownerId: payment.ownerId, // Uncommenting this line
            lineItems,
            amount: payment.amount,
            status: 'PAID'
          }
        } as any);

        // Generate PDF
        try {
          const fileId = await generateInvoicePdf(invoice.id);
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { pdfFileId: fileId } // Uncommenting this line
          } as any);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
        }

        // Update booking status to CONFIRMED
        bookingUpdate = await prisma.booking.update({
          where: { id: payment.bookingId! },
          data: { status: BookingStatus.CONFIRMED }
        });

        // Log invoice generation and booking confirmation
        await AuditLogger.logInvoiceGeneration(ownerId, payment.bookingId!, paymentId, invoice.id, invoiceNo);
        await AuditLogger.logBookingStatusChange(ownerId, payment.bookingId!, 'PENDING', 'CONFIRMED');
      }

      // Log payment verification/rejection
      await AuditLogger.logPaymentVerification(ownerId, payment.bookingId!, paymentId, action, reason);

      res.status(200).json({
        success: true,
        data: {
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
          verifiedBy: updatedPayment.verifiedBy, // Uncommenting this line
          verifiedAt: updatedPayment.verifiedAt, // Uncommenting this line
          invoice: invoice ? {
            id: invoice.id,
            invoiceNo: invoice.invoiceNo, // Uncommenting this line
            amount: invoice.amount, // Uncommenting this line
            status: invoice.status // Uncommenting this line
          } : null,
          booking: bookingUpdate ? {
            id: bookingUpdate.id,
            status: bookingUpdate.status
          } : null
        },
        message: action === 'verify'
          ? 'Payment verified and invoice generated'
          : 'Payment rejected'
      });

    } catch (error) {
      console.error('Error verifying payment:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'PAYMENT_VERIFICATION_FAILED', message: 'Failed to verify payment' }
        });
      }
    }
  },

  /**
   * GET /api/payments/:paymentId
   * Get payment by ID
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getPaymentSchema.parse(req.params);
      const { paymentId } = validatedData;

      // Find payment and validate user access
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              property: true,
              user: true
            }
          },
          user: true,
          owner: true,
          invoice: true
        }
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        });
        return;
      }

      // Check if user has access to this payment
      if ((payment as any).userId !== userId && (payment as any).ownerId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view this payment' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_PAYMENT_FAILED', message: 'Failed to get payment' }
        });
      }
    }
  },

  /**
   * GET /api/payments/booking/:bookingId
   * Get payments by booking ID
   */
  async getPaymentsByBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getPaymentsByBookingSchema.parse(req.params);
      const { bookingId } = validatedData;

      // Validate booking exists and user has access
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
        });
        return;
      }

      if (booking.userId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view payments for this booking' }
        });
        return;
      }

      const payments = await prisma.payment.findMany({
        where: { bookingId },
        include: {
          user: true,
          owner: true,
          invoice: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error getting payments by booking:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_PAYMENTS_FAILED', message: 'Failed to get payments' }
        });
      }
    }
  },

  /**
   * GET /api/payments/owner/:ownerId
   * Get owner payments
   */
  async getOwnerPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getOwnerPaymentsSchema.parse(req.params);
      const { ownerId } = validatedData;

      // Check if user is the owner
      if (ownerId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view these payments' }
        });
        return;
      }

      const payments = await prisma.payment.findMany({
        where: { ownerId },
        include: {
          user: { select: { name: true, email: true } },
          booking: {
            include: {
              property: { select: { name: true } },
              user: { select: { name: true, email: true } }
            }
          },
          invoice: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error getting owner payments:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_OWNER_PAYMENTS_FAILED', message: 'Failed to get owner payments' }
        });
      }
    }
  },

  /**
   * GET /api/payments/tenant/:userId
   * Get tenant payments
   */
  async getTenantPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getTenantPaymentsSchema.parse(req.params);
      const { userId: targetUserId } = validatedData;

      // Check if user is the tenant
      if (targetUserId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view these payments' }
        });
        return;
      }

      const payments = await prisma.payment.findMany({
        where: { userId: targetUserId },
        include: {
          booking: {
            include: {
              property: true,
              user: true
            }
          },
          user: true,
          owner: true,
          invoice: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error getting tenant payments:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_TENANT_PAYMENTS_FAILED', message: 'Failed to get tenant payments' }
        });
      }
    }
  },

  /**
   * POST /api/payments/refund
   * Process payment refund
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.currentUser?.id;
      if (!ownerId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = refundPaymentSchema.parse(req.body);
      const { paymentId, amount, reason } = validatedData;

      // Find and validate payment
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          ownerId,
          status: 'VERIFIED'
        },
        include: {
          booking: true
        }
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for refund' }
        });
        return;
      }

      // Check if refund amount exceeds payment amount
      if (amount > payment.amount) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REFUND_AMOUNT', message: 'Refund amount cannot exceed payment amount' }
        });
        return;
      }

      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          paymentId,
          amount,
          reason,
          status: 'PENDING',
          processedBy: ownerId
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: amount,
          refundReason: reason
        }
      });

      // Log refund
      await AuditLogger.logPaymentVerification(ownerId, payment.bookingId!, paymentId, 'refund', reason);

      res.status(200).json({
        success: true,
        data: {
          refundId: refund.id,
          paymentId,
          amount,
          reason,
          status: refund.status
        },
        message: 'Refund processed successfully'
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'REFUND_PROCESSING_FAILED', message: 'Failed to process refund' }
        });
      }
    }
  },

  /**
   * GET /api/payments/:paymentId/audit
   * Get payment audit logs
   */
  async getPaymentAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getPaymentAuditLogsSchema.parse(req.params);
      const { paymentId } = validatedData;

      // Verify user has access to this payment
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          OR: [ // Uncommenting this line
            { userId }, // Tenant access
            { ownerId: userId } // Owner access
          ]
        }
      } as any);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        });
        return;
      }

      const auditLogs = await AuditLogger.getPaymentAuditLogs(paymentId);

      res.status(200).json({
        success: true,
        data: auditLogs
      });
    } catch (error) {
      console.error('Error getting payment audit logs:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_AUDIT_LOGS_FAILED', message: 'Failed to get audit logs' }
        });
      }
    }
  },

  /**
   * GET /api/payments/pending
   * Get pending payments for owner verification
   */
  async getPendingPayments(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.currentUser?.id;
      if (!ownerId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const pendingPayments = await prisma.payment.findMany({
        where: {
          ownerId,
          status: PaymentStatus.AWAITING_OWNER_VERIFICATION,
        },
        include: {
          user: { select: { name: true, email: true } },
          booking: { include: { property: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: pendingPayments
      });
    } catch (error) {
      console.error('Error getting pending payments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'GET_PENDING_PAYMENTS_FAILED', message: 'Failed to get pending payments' }
      });
    }
  },

  /**
   * GET /api/payments/booking/:bookingId/audit
   * Get booking audit logs
   */
  async getBookingAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validatedData = getBookingAuditLogsSchema.parse(req.params);
      const { bookingId } = validatedData;

      // Verify user has access to this booking
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [ // Uncommenting this line
            { userId }, // Tenant access
            { property: { ownerId: userId } } // Owner access
          ]
        }
      } as any);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
        });
        return;
      }

      const auditLogs = await AuditLogger.getBookingAuditLogs(bookingId);

      res.status(200).json({
        success: true,
        data: auditLogs
      });
    } catch (error) {
      console.error('Error getting booking audit logs:', error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message }
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'GET_AUDIT_LOGS_FAILED', message: 'Failed to get audit logs' }
        });
      }
    }
  }
};
