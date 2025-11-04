import { Router } from 'express';
import { PaymentController } from '../payment';
import { requireAuth } from '../middleware';
import { strictRateLimiter, mediumRateLimiter } from '../rateLimiter';

const router = Router();

// All payment routes require authentication
router.use(requireAuth);

// POST /api/payments/create (strict rate limiting)
router.post('/create', strictRateLimiter, PaymentController.createPayment);

// POST /api/payments/confirm (strict rate limiting)
router.post('/confirm', strictRateLimiter, PaymentController.confirmPayment);

// POST /api/payments/verify (strict rate limiting)
router.post('/verify', strictRateLimiter, PaymentController.verifyPayment);

// GET /api/payments/:paymentId (medium rate limiting)
router.get('/:paymentId', mediumRateLimiter, PaymentController.getPayment);

// GET /api/payments/booking/:bookingId (medium rate limiting)
router.get('/booking/:bookingId', mediumRateLimiter, PaymentController.getPaymentsByBooking);

// GET /api/payments/owner/:ownerId (medium rate limiting)
router.get('/owner/:ownerId', mediumRateLimiter, requireAuth, PaymentController.getOwnerPayments);

// GET /api/payments/tenant/:userId (medium rate limiting)
router.get('/tenant/:userId', mediumRateLimiter, PaymentController.getTenantPayments);

// POST /api/payments/refund (strict rate limiting)
router.post('/refund', strictRateLimiter, PaymentController.refundPayment);

// GET /api/payments/:paymentId/audit (medium rate limiting)
router.get('/:paymentId/audit', mediumRateLimiter, PaymentController.getPaymentAuditLogs);

// GET /api/payments/booking/:bookingId/audit (medium rate limiting)
router.get('/booking/:bookingId/audit', mediumRateLimiter, PaymentController.getBookingAuditLogs);

// GET /api/payments/pending (owner-only, medium rate limiting)
router.get('/pending', mediumRateLimiter, (req, res, next) => {
  // Check if user is owner
  if (req.currentUser?.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Only owners can view pending payments' }
    });
  }
  next();
}, PaymentController.getPendingPayments);

export default router;