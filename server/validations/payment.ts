import { z } from 'zod';

// Payment creation validation schema
export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive').optional(),
  upiId: z.string().email('Invalid UPI ID format').optional(),
  merchantName: z.string().min(1, 'Merchant name is required').optional(),
});

// Payment confirmation validation schema
export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  upiReference: z.string().optional(),
});

// Payment verification validation schema
export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  action: z.enum(['verify', 'reject']),
  reason: z.string().optional(),
});

// Payment refund validation schema
export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required'),
});

// Get payment validation schema
export const getPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

// Get payments by booking validation schema
export const getPaymentsByBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

// Get owner payments validation schema
export const getOwnerPaymentsSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// Get tenant payments validation schema
export const getTenantPaymentsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Get payment audit logs validation schema
export const getPaymentAuditLogsSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

// Get booking audit logs validation schema
export const getBookingAuditLogsSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

// Export types
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type GetPaymentInput = z.infer<typeof getPaymentSchema>;
export type GetPaymentsByBookingInput = z.infer<typeof getPaymentsByBookingSchema>;
export type GetOwnerPaymentsInput = z.infer<typeof getOwnerPaymentsSchema>;
export type GetTenantPaymentsInput = z.infer<typeof getTenantPaymentsSchema>;
export type GetPaymentAuditLogsInput = z.infer<typeof getPaymentAuditLogsSchema>;
export type GetBookingAuditLogsInput = z.infer<typeof getBookingAuditLogsSchema>;