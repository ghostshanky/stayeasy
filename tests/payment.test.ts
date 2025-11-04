
import { PrismaClient } from '@prisma/client';
import { PaymentController } from '../server/payment';
import { generateInvoicePdf } from '../prisma/pdfGenerator';
import { AuditLogger } from '../server/audit-logger';

const prisma = new PrismaClient();

// Mock request and response objects
const mockRequest = (body: any, params: any, user?: any) => ({
  body,
  params,
  user,
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PaymentController', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = mockRequest({}, {});
    mockRes = mockResponse();
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a new payment successfully', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 10000,
        upiId: 'test@upi',
        merchantName: 'Test Merchant',
      };

      // Mock the database calls
      prisma.booking.findUnique = jest.fn().mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        property: { ownerId: 'owner123' },
      });

      prisma.payment.findFirst = jest.fn().mockResolvedValue(null);

      prisma.payment.create = jest.fn().mockResolvedValue({
        id: 'payment123',
        bookingId: 'booking123',
        userId: 'user123',
        ownerId: 'owner123',
        amount: 10000,
        status: 'PENDING',
        upiUri: 'upi://pay?pa=test@upi&pn=Test+Merchant&am=100.00&cu=INR&tr=TXN123',
        transactionId: 'TXN123',
        booking: {
          id: 'booking123',
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          property: { id: 'property123', name: 'Test Property' },
        },
      });

      // Mock QR code generation
      jest.spyOn(require('qrcode'), 'toDataURL').mockResolvedValue('data:image/png;base64,...');

      // Mock audit logger
      AuditLogger.logPaymentCreation = jest.fn().mockResolvedValue(undefined);

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        paymentId: 'payment123',
        upiUri: 'upi://pay?pa=test@upi&pn=Test+Merchant&am=100.00&cu=INR&tr=TXN123',
        qrCode: 'data:image/png;base64,...',
        transactionId: 'TXN123',
        amount: 10000,
        booking: {
          id: 'booking123',
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          property: { id: 'property123', name: 'Test Property' },
        },

      });

    });

    it('should return error if booking not found', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 10000,
      };

      prisma.booking.findUnique = jest.fn().mockResolvedValue(null);

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Booking not found' });
    });

    it('should return error if user is not authorized', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 10000,
      };

      prisma.booking.findUnique = jest.fn().mockResolvedValue({
        id: 'booking123',
        userId: 'differentUser',
        property: { ownerId: 'owner123' },
      });

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to create payment for this booking' });
    });

    it('should return error if payment already exists', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 10000,
      };

      prisma.booking.findUnique = jest.fn().mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        property: { ownerId: 'owner123' },
      });

      prisma.payment.findFirst = jest.fn().mockResolvedValue({
        id: 'existingPayment',
        bookingId: 'booking123',
      });

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const paymentData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
        upiReference: 'UPI123',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        bookingId: 'booking123',
        status: 'PENDING',
      });

      prisma.payment.update = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        bookingId: 'booking123',
        status: 'COMPLETED',
        transactionId: 'TXN123',
        upiReference: 'UPI123',
        completedAt: new Date(),
        booking: { id: 'booking123' },
      });

      prisma.booking.update = jest.fn().mockResolvedValue({
        id: 'booking123',
        status: 'CONFIRMED',
      });

      prisma.invoice.create = jest.fn().mockResolvedValue({
        id: 'invoice123',
        paymentId: 'payment123',
        bookingId: 'booking123',
        userId: 'user123',
        ownerId: 'owner123',
        amount: 10000,
        status: 'PENDING',
        invoiceNo: 'INV123',
        details: 'Payment confirmed for booking booking123',
      });

      AuditLogger.logPaymentConfirmation = jest.fn().mockResolvedValue(undefined);

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: {
          id: 'payment123',
          userId: 'user123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          transactionId: 'TXN123',
          upiReference: 'UPI123',
          completedAt: expect.any(Date),
          booking: { id: 'booking123' },
        },
        invoice: {
          id: 'invoice123',
          paymentId: 'payment123',
          bookingId: 'booking123',
          userId: 'user123',
          ownerId: 'owner123',
          amount: 10000,
          status: 'PENDING',
          invoiceNo: 'INV123',
          details: 'Payment confirmed for booking booking123',
        },
        message: 'Payment confirmed successfully',
      });
    });

    it('should return error if payment not found', async () => {
      const paymentData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue(null);

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Payment not found' });
    });

    it('should return error if user is not authorized', async () => {
      const paymentData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'differentUser',
        bookingId: 'booking123',
        status: 'PENDING',
      });

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to confirm this payment' });
    });

    it('should return error if payment already completed', async () => {
      const paymentData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        bookingId: 'booking123',
        status: 'COMPLETED',
      });

      mockReq.body = paymentData;
      mockReq.user = { id: 'user123' };

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const paymentData = {
        paymentId: 'payment123',
        action: 'verify',
        reason: 'Payment verified',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'PENDING',
        amount: 10000,
      });

      prisma.payment.update = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'COMPLETED',
        verifiedAt: new Date(),
        verificationReason: 'Payment verified',
        booking: { id: 'booking123' },
      });

      prisma.booking.update = jest.fn().mockResolvedValue({
        id: 'booking123',
        status: 'CONFIRMED',
      });

      prisma.invoice.create = jest.fn().mockResolvedValue({
        id: 'invoice123',
        paymentId: 'payment123',
        bookingId: 'booking123',
        userId: 'user123',
        ownerId: 'owner123',
        amount: 10000,
        status: 'PENDING',
        invoiceNo: 'INV123',
        details: 'Payment verified for booking booking123',
      });

      prisma.invoice.update = jest.fn().mockResolvedValue({
        id: 'invoice123',
        fileId: 'file123',
      });

      AuditLogger.logPaymentVerification = jest.fn().mockResolvedValue(undefined);

      // Mock PDF generation
      jest.spyOn(require('../prisma/pdfGenerator'), 'generateInvoicePdf').mockResolvedValue('file123');

      mockReq.body = paymentData;
      mockReq.user = { id: 'owner123' };

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          verifiedAt: expect.any(Date),
          verificationReason: 'Payment verified',
          booking: { id: 'booking123' },
        },
        message: 'Payment verified successfully',
      });
    });

    it('should reject payment successfully', async () => {
      const paymentData = {
        paymentId: 'payment123',
        action: 'reject',
        reason: 'Payment rejected',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'PENDING',
        amount: 10000,
      });

      prisma.payment.update = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'FAILED',
        verifiedAt: new Date(),
        verificationReason: 'Payment rejected',
        booking: { id: 'booking123' },
      });

      AuditLogger.logPaymentVerification = jest.fn().mockResolvedValue(undefined);

      mockReq.body = paymentData;
      mockReq.user = { id: 'owner123' };

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'FAILED',
          verifiedAt: expect.any(Date),
          verificationReason: 'Payment rejected',
          booking: { id: 'booking123' },
        },
        message: 'Payment rejected successfully',
      });
    });

    it('should return error if user is not authorized', async () => {
      const paymentData = {
        paymentId: 'payment123',
        action: 'verify',
        reason: 'Payment verified',
      };

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'differentOwner',
        bookingId: 'booking123',
        status: 'PENDING',
      });

      mockReq.body = paymentData;
      mockReq.user = { id: 'owner123' };

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});

  describe('getPayment', () => {
    it('should get payment by ID successfully', async () => {
      const paymentId = 'payment123';

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'COMPLETED',
        booking: {
          id: 'booking123',
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          property: { id: 'property123', name: 'Test Property' },
        },
        user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
        owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
        invoice: { id: 'invoice123', invoiceNo: 'INV123' },
      });

      mockReq.params = { paymentId };

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          booking: {
            id: 'booking123',
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            property: { id: 'property123', name: 'Test Property' },
          },
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
          invoice: { id: 'invoice123', invoiceNo: 'INV123' },
        },
      });
    });

    it('should return error if payment not found', async () => {
      const paymentId = 'payment123';

      prisma.payment.findUnique = jest.fn().mockResolvedValue(null);

      mockReq.params = { paymentId };

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Payment not found' });
    });

    it('should return error if user is not authorized', async () => {
      const paymentId = 'payment123';

      prisma.payment.findUnique = jest.fn().mockResolvedValue({
        id: 'payment123',
        userId: 'differentUser',
        ownerId: 'differentOwner',
        bookingId: 'booking123',
        status: 'COMPLETED',
      });

      mockReq.params = { paymentId };
      mockReq.user = { id: 'user123', role: 'TENANT' };

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});

  describe('getPaymentsByBooking', () => {
    it('should get payments by booking ID successfully', async () => {
      const bookingId = 'booking123';

      prisma.booking.findUnique = jest.fn().mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
      });

      prisma.payment.findMany = jest.fn().mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
          invoice: { id: 'invoice123', invoiceNo: 'INV123' },
        },
      ]);

      mockReq.params = { bookingId };

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: [
          {
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            status: 'COMPLETED',
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
            invoice: { id: 'invoice123', invoiceNo: 'INV123' },
          },
        ],
      });
    });

    it('should return error if booking not found', async () => {
      const bookingId = 'booking123';

      prisma.booking.findUnique = jest.fn().mockResolvedValue(null);

      mockReq.params = { bookingId };

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Booking not found' });
    });

    it('should return error if user is not authorized', async () => {
      const bookingId = 'booking123';

      prisma.booking.findUnique = jest.fn().mockResolvedValue({
        id: 'booking123',
        userId: 'differentUser',
      });

      mockReq.params = { bookingId };
      mockReq.user = { id: 'user123', role: 'TENANT' };

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to view payments for this booking' });
    });
  });

  describe('getOwnerPayments', () => {
    it('should get owner payments successfully', async () => {
      const ownerId = 'owner123';

      prisma.payment.findMany = jest.fn().mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          booking: {
            id: 'booking123',
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            property: { id: 'property123', name: 'Test Property' },
          },
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
          invoice: { id: 'invoice123', invoiceNo: 'INV123' },
        },
      ]);

      mockReq.params = { ownerId };
      mockReq.user = { id: 'owner123' };

      await PaymentController.getOwnerPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: [
          {
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            status: 'COMPLETED',
            booking: {
              id: 'booking123',
              user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
              property: { id: 'property123', name: 'Test Property' },
            },
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
            invoice: { id: 'invoice123', invoiceNo: 'INV123' },
          },
        ],
      });
    });

    it('should return error if user is not authorized', async () => {
      const ownerId = 'differentOwner';

      prisma.payment.findMany = jest.fn().mockResolvedValue([]);

      mockReq.params = { ownerId };
      mockReq.user = { id: 'owner123' };

      await PaymentController.getOwnerPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to view these payments' });
    });
  });

  describe('getTenantPayments', () => {
    it('should get tenant payments successfully', async () => {
      const userId = 'user123';

      prisma.payment.findMany = jest.fn().mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          status: 'COMPLETED',
          booking: {
            id: 'booking123',
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            property: { id: 'property123', name: 'Test Property' },
          },
          user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
          owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
          invoice: { id: 'invoice123', invoiceNo: 'INV123' },
        },
      ]);

      mockReq.params = { userId };

      await PaymentController.getTenantPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: [
          {
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            status: 'COMPLETED',
            booking: {
              id: 'booking123',
              user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
              property: { id: 'property123', name: 'Test Property' },
            },
            user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
            owner: { id: 'owner123', name: 'Test Owner', email: 'owner@example.com' },
            invoice: { id: 'invoice123', invoiceNo: 'INV123' },
          },
        ],
      });
    });

    it('should return error if user is not authorized', async () => {
      const userId = 'differentUser';

      prisma.payment.findMany = jest.fn().mockResolvedValue([]);

      mockReq.params = { userId };
      mockReq.user = { id: 'user123', role: 'TENANT' };

      await PaymentController.getTenantPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to view these payments' });
    });
  });

  describe('refundPayment', () => {
  it('should refund payment successfully', async () => {
    const refundData = {
      paymentId: 'payment123',
      amount: 5000,
      reason: 'Customer request',
    };

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'user123',
      ownerId: 'owner123',
      bookingId: 'booking123',
      status: 'COMPLETED',
      amount: 10000,
    });

    prisma.refund.create = jest.fn().mockResolvedValue({
      id: 'refund123',
      paymentId: 'payment123',
      amount: 5000,
      reason: 'Customer request',
      status: 'PENDING',
      processedBy: 'owner123',
    });

    prisma.payment.update = jest.fn().mockResolvedValue({
      id: 'payment123',
      status: 'REFUNDED',
      refundedAt: new Date(),
      refundAmount: 5000,
      refundReason: 'Customer request',
    });

    AuditLogger.logPaymentVerification = jest.fn().mockResolvedValue(undefined);

    mockReq.body = refundData;
    mockReq.user = { id: 'owner123' };

    await PaymentController.refundPayment(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      refund: {
        id: 'refund123',
        paymentId: 'payment123',
        amount: 5000,
        reason: 'Customer request',
        status: 'PENDING',
        processedBy: 'owner123',
      },
      message: 'Refund processed successfully',
    });
  });

  it('should return error if payment not found', async () => {
    const refundData = {
      paymentId: 'payment123',
      amount: 5000,
    };

    prisma.payment.findUnique = jest.fn().mockResolvedValue(null);

    mockReq.body = refundData;
    mockReq.user = { id: 'owner123' };

    await PaymentController.refundPayment(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Payment not found' });
  });

  it('should return error if user is not authorized', async () => {
    const refundData = {
      paymentId: 'payment123',
      amount: 5000,
    };

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'user123',
      ownerId: 'differentOwner',
      bookingId: 'booking123',
      status: 'COMPLETED',
      amount: 10000,
    });

    mockReq.body = refundData;
    mockReq.user = { id: 'owner123' };

    await PaymentController.refundPayment(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to refund this payment' });
  });

  it('should return error if payment is not completed', async () => {
    const refundData = {
      paymentId: 'payment123',
      amount: 5000,
    };

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'user123',
      ownerId: 'owner123',
      bookingId: 'booking123',
      status: 'PENDING',
      amount: 10000,
    });

    mockReq.body = refundData;
    mockReq.user = { id: 'owner123' };

    await PaymentController.refundPayment(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Can only refund completed payments' });
  });

  it('should return error if refund amount exceeds payment amount', async () => {
    const refundData = {
      paymentId: 'payment123',
      amount: 15000,
    };

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'user123',
      ownerId: 'owner123',
      bookingId: 'booking123',
      status: 'COMPLETED',
      amount: 10000,
    });

    mockReq.body = refundData;
    mockReq.user = { id: 'owner123' };

    await PaymentController.refundPayment(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Refund amount cannot exceed payment amount' });
  });
});

describe('getPaymentAuditLogs', () => {
  it('should get payment audit logs successfully', async () => {
    const paymentId = 'payment123';

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'user123',
      ownerId: 'owner123',
    });

    AuditLogger.getPaymentAuditLogs = jest.fn().mockResolvedValue([
      {
        id: 'audit123',
        action: 'PAYMENT_CREATED',
        details: 'Payment created for booking booking123',
        createdAt: new Date(),
        user: { id: 'user123', name: 'Test User', email: 'test@example.com', role: 'TENANT' },
      },
    ]);

    mockReq.params = { paymentId };
    mockReq.user = { id: 'user123' };

    await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      auditLogs: [
        {
          id: 'audit123',
          action: 'PAYMENT_CREATED',
          details: 'Payment created for booking booking123',
          createdAt: expect.any(Date),
          user: { id: 'user123', name: 'Test User', email: 'test@example.com', role: 'TENANT' },
        },
      ],
    });
  });

  it('should return error if payment not found', async () => {
    const paymentId = 'payment123';

    prisma.payment.findUnique = jest.fn().mockResolvedValue(null);

    mockReq.params = { paymentId };

    await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Payment not found' });
  });

  it('should return error if user is not authorized', async () => {
    const paymentId = 'payment123';

    prisma.payment.findUnique = jest.fn().mockResolvedValue({
      id: 'payment123',
      userId: 'differentUser',
      ownerId: 'differentOwner',
    });

    mockReq.params = { paymentId };
    mockReq.user = { id: 'user123', role: 'TENANT' };

    await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to view audit logs for this payment' });
  });
});

describe('getBookingAuditLogs', () => {
  it('should get booking audit logs successfully', async () => {
    const bookingId = 'booking123';

    prisma.booking.findUnique = jest.fn().mockResolvedValue({
      id: 'booking123',
      userId: 'user123',
    });

    AuditLogger.getBookingAuditLogs = jest.fn().mockResolvedValue([
      {
        id: 'audit123',
        action: 'BOOKING_CREATED',
        details: 'Booking created',
        createdAt: new Date(),
        user: { id: 'user123', name: 'Test User', email: 'test@example.com', role: 'TENANT' },
      },
    ]);

    mockReq.params = { bookingId };
    mockReq.user = { id: 'user123' };

    await PaymentController.getBookingAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      auditLogs: [
        {
          id: 'audit123',
          action: 'BOOKING_CREATED',
          details: 'Booking created',
          createdAt: expect.any(Date),
          user: { id: 'user123', name: 'Test User', email: 'test@example.com', role: 'TENANT' },
        },
      ],
    });
  });

  it('should return error if booking not found', async () => {
    const bookingId = 'booking123';

    prisma.booking.findUnique = jest.fn().mockResolvedValue(null);

    mockReq.params = { bookingId };

    await PaymentController.getBookingAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Booking not found' });
  });

  it('should return error if user is not authorized', async () => {
    const bookingId = 'booking123';

    prisma.booking.findUnique = jest.fn().mockResolvedValue({
      id: 'booking123',
      userId: 'differentUser',
    });

    mockReq.params = { bookingId };
    mockReq.user = { id: 'user123', role: 'TENANT' };

    await PaymentController.getBookingAuditLogs(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized to view audit logs for this booking' });
  });
});
