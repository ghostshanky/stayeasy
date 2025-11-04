"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// UPI Payment creation endpoint
app.post('/api/payments/create', async (req, res) => {
    try {
        const { bookingId, amount, upiId = 'kunalsable24@okaxis', merchantName = 'Kunal Sable' } = req.body;
        // Generate transaction ID
        const transactionId = `TXN${Date.now()}`;
        // Create UPI URI
        const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tr=${transactionId}`;
        // Generate QR Code
        const qrCodeDataURL = await qrcode_1.default.toDataURL(upiUri);
        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                bookingId: bookingId,
                amount: parseFloat(amount),
                status: 'PENDING',
                userId: 'dummy-user-id', // Add required fields
                ownerId: 'dummy-owner-id',
                currency: 'INR'
            },
        });
        res.json({
            success: true,
            paymentId: payment.id,
            upiUri,
            qrCode: qrCodeDataURL,
            transactionId,
            amount,
        });
    }
    catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create payment' });
    }
});
// Payment confirmation endpoint
app.post('/api/payments/confirm', async (req, res) => {
    try {
        const { paymentId, transactionId } = req.body;
        // Update payment status
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'COMPLETED' },
            include: { booking: true },
        });
        // Update booking status
        await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
        });
        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                paymentId: payment.id,
                details: `Payment confirmed for booking ${payment.bookingId}`,
                invoiceNo: `INV-${Date.now()}`,
                bookingId: payment.bookingId,
                userId: 'dummy-user-id',
                ownerId: 'dummy-owner-id',
                lineItems: [],
                amount: payment.amount,
                status: 'PAID'
            },
        });
        res.json({
            success: true,
            payment,
            invoice,
            message: 'Payment confirmed successfully',
        });
    }
    catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ success: false, error: 'Failed to confirm payment' });
    }
});
// Get pending payments for owner
app.get('/api/owner/payments/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;
        const payments = await prisma.payment.findMany({
            where: {
                booking: {
                    property: {
                        ownerId,
                    },
                },
                status: 'PENDING',
            },
            include: {
                booking: {
                    include: {
                        user: true,
                        property: true,
                    },
                },
            },
        });
        res.json({ success: true, payments });
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
});
// Verify payment (owner action)
app.post('/api/payments/verify', async (req, res) => {
    try {
        const { paymentId, action } = req.body; // action: 'verify' or 'reject'
        const status = action === 'verify' ? 'COMPLETED' : 'FAILED';
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: { status },
            include: { booking: true },
        });
        if (action === 'verify') {
            // Update booking status
            await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' },
            });
            // Create invoice
            await prisma.invoice.create({
                data: {
                    paymentId: payment.id,
                    details: `Payment verified for booking ${payment.bookingId}`,
                    invoiceNo: `INV-${Date.now()}`,
                    bookingId: payment.bookingId,
                    userId: 'dummy-user-id',
                    ownerId: 'dummy-owner-id',
                    lineItems: [],
                    amount: payment.amount,
                    status: 'PAID'
                },
            });
        }
        res.json({
            success: true,
            payment,
            message: `Payment ${action}ed successfully`,
        });
    }
    catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment' });
    }
});
exports.default = app;
