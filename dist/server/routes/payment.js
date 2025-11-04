"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_1 = require("../payment");
const middleware_1 = require("../middleware");
const rateLimiter_1 = require("../rateLimiter");
const router = (0, express_1.Router)();
// All payment routes require authentication
router.use(middleware_1.requireAuth);
// POST /api/payments/create (strict rate limiting)
router.post('/create', rateLimiter_1.strictRateLimiter, payment_1.PaymentController.createPayment);
// POST /api/payments/confirm (strict rate limiting)
router.post('/confirm', rateLimiter_1.strictRateLimiter, payment_1.PaymentController.confirmPayment);
// POST /api/payments/verify (strict rate limiting)
router.post('/verify', rateLimiter_1.strictRateLimiter, payment_1.PaymentController.verifyPayment);
// GET /api/payments/:paymentId (medium rate limiting)
router.get('/:paymentId', rateLimiter_1.mediumRateLimiter, payment_1.PaymentController.getPayment);
// GET /api/payments/booking/:bookingId (medium rate limiting)
router.get('/booking/:bookingId', rateLimiter_1.mediumRateLimiter, payment_1.PaymentController.getPaymentsByBooking);
// GET /api/payments/owner/:ownerId (medium rate limiting)
router.get('/owner/:ownerId', rateLimiter_1.mediumRateLimiter, middleware_1.requireAuth, payment_1.PaymentController.getOwnerPayments);
// GET /api/payments/tenant/:userId (medium rate limiting)
router.get('/tenant/:userId', rateLimiter_1.mediumRateLimiter, payment_1.PaymentController.getTenantPayments);
// POST /api/payments/refund (strict rate limiting)
router.post('/refund', rateLimiter_1.strictRateLimiter, payment_1.PaymentController.refundPayment);
// GET /api/payments/:paymentId/audit (medium rate limiting)
router.get('/:paymentId/audit', rateLimiter_1.mediumRateLimiter, payment_1.PaymentController.getPaymentAuditLogs);
// GET /api/payments/booking/:bookingId/audit (medium rate limiting)
router.get('/booking/:bookingId/audit', rateLimiter_1.mediumRateLimiter, payment_1.PaymentController.getBookingAuditLogs);
// GET /api/payments/pending (owner-only, medium rate limiting)
router.get('/pending', rateLimiter_1.mediumRateLimiter, (req, res, next) => {
    // Check if user is owner
    if (req.currentUser?.role !== 'OWNER') {
        return res.status(403).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Only owners can view pending payments' }
        });
    }
    next();
}, payment_1.PaymentController.getPendingPayments);
exports.default = router;
