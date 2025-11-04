"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = exports.UPIPaymentUtils = void 0;
const client_1 = require("@prisma/client");
const QRCode = __importStar(require("qrcode"));
const pdfGenerator_1 = require("../prisma/pdfGenerator");
const audit_logger_1 = require("./audit-logger");
// Enum values from Prisma schema
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["AWAITING_PAYMENT"] = "AWAITING_PAYMENT";
    PaymentStatus["AWAITING_OWNER_VERIFICATION"] = "AWAITING_OWNER_VERIFICATION";
    PaymentStatus["VERIFIED"] = "VERIFIED";
    PaymentStatus["REJECTED"] = "REJECTED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
})(PaymentStatus || (PaymentStatus = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (BookingStatus = {}));
const payment_1 = require("./validations/payment");
const prisma = new client_1.PrismaClient();
// UPI Payment utilities
class UPIPaymentUtils {
    /**
     * Generate UPI payment URI
     * Format: upi://pay?pa=merchant@upi&pn=PayeeName&am=Amount&tn=TransactionNote
     */
    static generateUPIPaymentURI(params) {
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
    static async generateQRCodeData(upiUri) {
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
        }
        catch (error) {
            console.error('QR Code generation failed:', error);
            return upiUri; // Fallback to URI
        }
    }
    /**
     * Generate unique invoice number
     */
    static generateInvoiceNumber() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `INV-${timestamp}-${random}`;
    }
    /**
     * Calculate booking amount
     */
    static calculateBookingAmount(booking) {
        const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return Math.round(booking.property.price * nights * 100); // Convert to paisa
    }
}
exports.UPIPaymentUtils = UPIPaymentUtils;
// Payment Controller
exports.PaymentController = {
    /**
     * POST /api/payments/create
     * Create payment record and generate UPI URI
     */
    async createPayment(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.createPaymentSchema.parse(req.body);
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
            const paymentData = {
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
            await audit_logger_1.AuditLogger.logPaymentCreation(userId, bookingId, payment.id, finalAmount);
            res.status(201).json({
                success: true,
                data: {
                    paymentId: payment.id,
                    bookingId,
                    amount: payment.amount,
                    currency: payment.currency,
                    upiUri: payment.upiUri,
                    status: payment.status,
                    createdAt: payment.createdAt
                }
            });
        }
        catch (error) {
            console.error('Error creating payment:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async confirmPayment(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.confirmPaymentSchema.parse(req.body);
            const { paymentId, transactionId, upiReference } = validatedData;
            // Find and validate payment
            const payment = await prisma.payment.findFirst({
                where: {
                    id: paymentId,
                    userId, // Uncommenting this line
                    status: PaymentStatus.AWAITING_PAYMENT
                }
            });
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
            });
            // Log payment confirmation
            await audit_logger_1.AuditLogger.logPaymentConfirmation(userId, payment.bookingId, paymentId, upiReference);
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
        }
        catch (error) {
            console.error('Error confirming payment:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async verifyPayment(req, res) {
        try {
            const ownerId = req.currentUser?.id;
            if (!ownerId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.verifyPaymentSchema.parse(req.body);
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
            });
            let invoice = null;
            let bookingUpdate = null;
            if (action === 'verify') {
                // Generate invoice
                const invoiceNo = UPIPaymentUtils.generateInvoiceNumber();
                const lineItems = [
                    {
                        description: `Accommodation at ${payment.booking?.property?.name}`,
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
                });
                // Generate PDF
                try {
                    const fileId = await (0, pdfGenerator_1.generateInvoicePdf)(invoice.id);
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { pdfFileId: fileId } // Uncommenting this line
                    });
                }
                catch (pdfError) {
                    console.error('PDF generation failed:', pdfError);
                }
                // Update booking status to CONFIRMED
                bookingUpdate = await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: BookingStatus.CONFIRMED }
                });
                // Log invoice generation and booking confirmation
                await audit_logger_1.AuditLogger.logInvoiceGeneration(ownerId, payment.bookingId, paymentId, invoice.id, invoiceNo);
                await audit_logger_1.AuditLogger.logBookingStatusChange(ownerId, payment.bookingId, 'PENDING', 'CONFIRMED');
            }
            // Log payment verification/rejection
            await audit_logger_1.AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, action, reason);
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
        }
        catch (error) {
            console.error('Error verifying payment:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getPayment(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getPaymentSchema.parse(req.params);
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
            if (payment.userId !== userId && payment.ownerId !== userId) {
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
        }
        catch (error) {
            console.error('Error getting payment:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getPaymentsByBooking(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getPaymentsByBookingSchema.parse(req.params);
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
        }
        catch (error) {
            console.error('Error getting payments by booking:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getOwnerPayments(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getOwnerPaymentsSchema.parse(req.params);
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
        }
        catch (error) {
            console.error('Error getting owner payments:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getTenantPayments(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getTenantPaymentsSchema.parse(req.params);
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
        }
        catch (error) {
            console.error('Error getting tenant payments:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async refundPayment(req, res) {
        try {
            const ownerId = req.currentUser?.id;
            if (!ownerId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.refundPaymentSchema.parse(req.body);
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
            await audit_logger_1.AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, 'refund', reason);
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
        }
        catch (error) {
            console.error('Error processing refund:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getPaymentAuditLogs(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getPaymentAuditLogsSchema.parse(req.params);
            const { paymentId } = validatedData;
            // Verify user has access to this payment
            const payment = await prisma.payment.findFirst({
                where: {
                    id: paymentId,
                    OR: [
                        { userId }, // Tenant access
                        { ownerId: userId } // Owner access
                    ]
                }
            });
            if (!payment) {
                res.status(404).json({
                    success: false,
                    error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
                });
                return;
            }
            const auditLogs = await audit_logger_1.AuditLogger.getPaymentAuditLogs(paymentId);
            res.status(200).json({
                success: true,
                data: auditLogs
            });
        }
        catch (error) {
            console.error('Error getting payment audit logs:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
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
    async getPendingPayments(req, res) {
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
        }
        catch (error) {
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
    async getBookingAuditLogs(req, res) {
        try {
            const userId = req.currentUser?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const validatedData = payment_1.getBookingAuditLogsSchema.parse(req.params);
            const { bookingId } = validatedData;
            // Verify user has access to this booking
            const booking = await prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    OR: [
                        { userId }, // Tenant access
                        { property: { ownerId: userId } } // Owner access
                    ]
                }
            });
            if (!booking) {
                res.status(404).json({
                    success: false,
                    error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
                });
                return;
            }
            const auditLogs = await audit_logger_1.AuditLogger.getBookingAuditLogs(bookingId);
            res.status(200).json({
                success: true,
                data: auditLogs
            });
        }
        catch (error) {
            console.error('Error getting booking audit logs:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: error.message }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: { code: 'GET_AUDIT_LOGS_FAILED', message: 'Failed to get audit logs' }
                });
            }
        }
    }
};
