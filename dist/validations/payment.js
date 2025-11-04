"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingAuditLogsSchema = exports.getPaymentAuditLogsSchema = exports.getTenantPaymentsSchema = exports.getOwnerPaymentsSchema = exports.getPaymentsByBookingSchema = exports.getPaymentSchema = exports.refundPaymentSchema = exports.verifyPaymentSchema = exports.confirmPaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
// Payment creation validation schema
exports.createPaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
    amount: zod_1.z.number().positive('Amount must be positive').optional(),
    upiId: zod_1.z.string().email('Invalid UPI ID format').optional(),
    merchantName: zod_1.z.string().min(1, 'Merchant name is required').optional(),
}).refine(data => {
    // If amount is not provided, it will be calculated from booking
    return true;
}, {
    message: 'Amount is required when provided',
});
// Payment confirmation validation schema
exports.confirmPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    transactionId: zod_1.z.string().min(1, 'Transaction ID is required'),
    upiReference: zod_1.z.string().optional(),
});
// Payment verification validation schema
exports.verifyPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    action: zod_1.z.enum(['verify', 'reject']),
    reason: zod_1.z.string().optional(),
});
// Payment refund validation schema
exports.refundPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    amount: zod_1.z.number().positive('Refund amount must be positive'),
    reason: zod_1.z.string().min(1, 'Refund reason is required'),
});
// Get payment validation schema
exports.getPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
});
// Get payments by booking validation schema
exports.getPaymentsByBookingSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
});
// Get owner payments validation schema
exports.getOwnerPaymentsSchema = zod_1.z.object({
    ownerId: zod_1.z.string().min(1, 'Owner ID is required'),
});
// Get tenant payments validation schema
exports.getTenantPaymentsSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
});
// Get payment audit logs validation schema
exports.getPaymentAuditLogsSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
});
// Get booking audit logs validation schema
exports.getBookingAuditLogsSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
});
