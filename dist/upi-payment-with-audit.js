"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceGenerator = exports.UPIPaymentUtils = void 0;
const client_1 = require("@prisma/client");
const middleware_js_1 = require("./middleware.js");
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const audit_logger_js_1 = require("./audit-logger.js");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// UPI URI and QR Code generation utilities
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
            const qrCodeDataURL = await qrcode_1.default.toDataURL(upiUri, {
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
        const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
        return `INV-${timestamp}-${random}`;
    }
    /**
     * Calculate booking amount (simplified - add your business logic)
     */
    static calculateBookingAmount(booking) {
        // Simplified calculation - replace with your pricing logic
        const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return Math.round(booking.property.price * nights * 100); // Convert to paisa
    }
}
exports.UPIPaymentUtils = UPIPaymentUtils;
// PDF Generation utility (simplified - use pdfkit or puppeteer in production)
class InvoiceGenerator {
    static generateInvoiceHTML(invoice) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .details { margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>StayEasy Invoice</h1>
          <p>Invoice #: ${invoice.invoiceNo}</p>
          <p>Date: ${invoice.createdAt.toLocaleDateString()}</p>
        </div>

        <div class="details">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${invoice.bookingId || 'N/A'}</p>
          <p><strong>Tenant:</strong> ${invoice.user.name} (${invoice.user.email})</p>
          <p><strong>Owner:</strong> ${invoice.owner.name} (${invoice.owner.email})</p>
          <p><strong>Property:</strong> ${invoice.booking?.property?.name || 'N/A'}</p>
          <p><strong>Check-in:</strong> ${invoice.booking?.checkIn?.toLocaleDateString() || 'N/A'}</p>
          <p><strong>Check-out:</strong> ${invoice.booking?.checkOut?.toLocaleDateString() || 'N/A'}</p>
        </div>

        <div class="details">
          <h3>Payment Details</h3>
          <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
          <p class="amount">Total Amount: ₹${(invoice.amount / 100).toFixed(2)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lineItems.map((item) => `
              <tr>
                <td>${item.description}</td>
                <td>₹${(item.amount / 100).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; color: #666;">
          <p>Thank you for using StayEasy!</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `;
    }
    // In production, use puppeteer or pdfkit to generate actual PDF
    static async generateInvoicePDF(invoice) {
        const html = this.generateInvoiceHTML(invoice);
        // For now, save as HTML file - in production convert to PDF
        const fileName = `invoice-${invoice.id}.html`;
        const filePath = path_1.default.join(process.cwd(), 'invoices', fileName);
        // Ensure invoices directory exists
        if (!fs_1.default.existsSync(path_1.default.dirname(filePath))) {
            fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, html);
        // In production, you'd convert HTML to PDF here
        // Return file path or upload to cloud storage
        return filePath;
    }
}
exports.InvoiceGenerator = InvoiceGenerator;
// API Routes
/**
 * POST /api/payments/create
 * Create payment record and generate UPI URI
 */
router.post('/create', middleware_js_1.requireAuth, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.currentUser.id;
        // Validate booking exists and belongs to user
        const booking = await prisma.booking.findFirst({
            where: {
                id: bookingId,
                userId,
                status: 'PENDING' // Only allow payment for pending bookings
            },
            include: {
                property: {
                    include: { owner: true }
                }
            }
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment' }
            });
        }
        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
            where: { bookingId }
        });
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                error: { code: 'PAYMENT_EXISTS', message: 'Payment already initiated for this booking' }
            });
        }
        // Calculate amount
        const amount = UPIPaymentUtils.calculateBookingAmount(booking);
        // Generate UPI URI
        const upiUri = UPIPaymentUtils.generateUPIPaymentURI({
            payeeUPI: booking.property.owner.email, // Using email as UPI ID for demo
            payeeName: booking.property.owner.name,
            amount: amount / 100, // Convert from paisa to rupees
            transactionNote: `StayEasy Booking ${bookingId}`
        });
        // Generate QR Code
        const qrCode = await UPIPaymentUtils.generateQRCodeData(upiUri);
        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                bookingId,
                userId,
                ownerId: booking.property.ownerId,
                amount,
                currency: 'INR',
                upiUri,
                status: 'AWAITING_PAYMENT'
            }
        });
        // Log payment creation
        await audit_logger_js_1.AuditLogger.logPaymentCreation(userId, bookingId, payment.id, amount);
        res.status(201).json({
            success: true,
            data: {
                paymentId: payment.id,
                bookingId,
                amount: payment.amount,
                currency: payment.currency,
                upiUri: payment.upiUri,
                qrCode,
                status: payment.status,
                createdAt: payment.createdAt
            }
        });
    }
    catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            error: { code: 'PAYMENT_CREATION_FAILED', message: 'Failed to create payment' }
        });
    }
});
/**
 * POST /api/payments/confirm
 * Tenant confirms payment is made
 */
router.post('/confirm', middleware_js_1.requireAuth, async (req, res) => {
    try {
        const { paymentId, upiReference } = req.body;
        const userId = req.currentUser.id;
        // Find and validate payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId,
                status: 'AWAITING_PAYMENT'
            }
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for confirmation' }
            });
        }
        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'AWAITING_OWNER_VERIFICATION',
                upiReference: upiReference || null,
                updatedAt: new Date()
            }
        });
        // Log payment confirmation
        await audit_logger_js_1.AuditLogger.logPaymentConfirmation(userId, payment.bookingId, paymentId, upiReference);
        res.json({
            success: true,
            data: {
                paymentId: updatedPayment.id,
                status: updatedPayment.status,
                upiReference: updatedPayment.upiReference,
                updatedAt: updatedPayment.updatedAt
            },
            message: 'Payment confirmation submitted. Waiting for owner verification.'
        });
    }
    catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            error: { code: 'PAYMENT_CONFIRMATION_FAILED', message: 'Failed to confirm payment' }
        });
    }
});
/**
 * POST /api/payments/verify
 * Owner verifies or rejects payment
 */
router.post('/verify', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), async (req, res) => {
    try {
        const { paymentId, action, reason } = req.body; // action: 'verify' or 'reject'
        const ownerId = req.currentUser.id;
        if (!['verify', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_ACTION', message: 'Action must be "verify" or "reject"' }
            });
        }
        // Find and validate payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                ownerId,
                status: 'AWAITING_OWNER_VERIFICATION'
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
            return res.status(404).json({
                success: false,
                error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for verification' }
            });
        }
        const newStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED';
        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: newStatus,
                verifiedBy: ownerId,
                verifiedAt: new Date(),
                updatedAt: new Date()
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
                    invoiceNo,
                    bookingId: payment.bookingId,
                    paymentId: payment.id,
                    userId: payment.userId,
                    ownerId: payment.ownerId,
                    lineItems,
                    amount: payment.amount,
                    status: 'PAID',
                    details: `Invoice for booking ${payment.bookingId}`
                }
            });
            // Generate PDF (simplified)
            const pdfPath = await InvoiceGenerator.generateInvoicePDF({
                ...invoice,
                user: payment.user,
                owner: req.currentUser,
                booking: payment.booking
            });
            // Update invoice with PDF file reference
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { pdfFileId: pdfPath }
            });
            // Update booking status to CONFIRMED
            bookingUpdate = await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' }
            });
            // Log invoice generation and booking confirmation
            await audit_logger_js_1.AuditLogger.logInvoiceGeneration(ownerId, payment.bookingId, paymentId, invoice.id, invoiceNo);
            await audit_logger_js_1.AuditLogger.logBookingStatusChange(ownerId, payment.bookingId, 'PENDING', 'CONFIRMED');
        }
        // Log payment verification/rejection
        await audit_logger_js_1.AuditLogger.logPaymentVerification(ownerId, payment.bookingId, paymentId, action, reason);
        res.json({
            success: true,
            data: {
                paymentId: updatedPayment.id,
                status: updatedPayment.status,
                verifiedBy: updatedPayment.verifiedBy,
                verifiedAt: updatedPayment.verifiedAt,
                invoice: invoice ? {
                    id: invoice.id,
                    invoiceNo: invoice.invoiceNo,
                    amount: invoice.amount,
                    status: invoice.status
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
        res.status(500).json({
            success: false,
            error: { code: 'PAYMENT_VERIFICATION_FAILED', message: 'Failed to verify payment' }
        });
    }
});
/**
 * GET /api/payments/pending
 * Get pending payments for owner verification
 */
router.get('/pending', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), async (req, res) => {
    try {
        const ownerId = req.currentUser.id;
        const payments = await prisma.payment.findMany({
            where: {
                ownerId,
                status: 'AWAITING_OWNER_VERIFICATION'
            },
            include: {
                booking: {
                    include: {
                        property: true,
                        user: { select: { id: true, name: true, email: true } }
                    }
                },
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: payments.map(payment => ({
                id: payment.id,
                bookingId: payment.bookingId,
                amount: payment.amount,
                currency: payment.currency,
                upiReference: payment.upiReference,
                status: payment.status,
                createdAt: payment.createdAt,
                user: payment.user,
                booking: payment.booking ? {
                    id: payment.booking.id,
                    checkIn: payment.booking.checkIn,
                    checkOut: payment.booking.checkOut,
                    property: {
                        name: payment.booking.property.name,
                        address: payment.booking.property.address
                    }
                } : null
            }))
        });
    }
    catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_PAYMENTS_FAILED', message: 'Failed to fetch pending payments' }
        });
    }
});
/**
 * GET /api/payments/:paymentId/audit
 * Get audit logs for a specific payment
 */
router.get('/:paymentId/audit', middleware_js_1.requireAuth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.currentUser.id;
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
            return res.status(404).json({
                success: false,
                error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
            });
        }
        const auditLogs = await audit_logger_js_1.AuditLogger.getPaymentAuditLogs(paymentId);
        res.json({
            success: true,
            data: auditLogs
        });
    }
    catch (error) {
        console.error('Error fetching payment audit logs:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_AUDIT_LOGS_FAILED', message: 'Failed to fetch audit logs' }
        });
    }
});
exports.default = router;
