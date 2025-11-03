
import { PaymentController } from '../server/payment';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePdf } from '../prisma/pdfGenerator';
import { AuditLogger } from '../server/audit-logger';

// Mock PrismaClient
jest.mock('@prisma/client');
const mockPrisma = new PrismaClient() as any;

// Mock dependencies
jest.mock('../prisma/pdfGenerator');
jest.mock('../server/audit-logger');

// Mock request and response objects
const mockRequest = (body: any, params: any, user?: any) => ({
  body,
  params,
  currentUser: user,
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PaymentController Unit Tests', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = mockRequest({}, {}, { id: 'user123', role: 'TENANT' });
    mockRes = mockResponse();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a new payment successfully', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 3000,
      };

      mockReq.body = paymentData;
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      // Mock Prisma methods
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        status: 'PENDING',
        property: {
          id: 'property123',
          ownerId: 'owner123',
          name: 'Test Property',
          price: 1000,
          owner: {
            email: 'owner@test.com',
            name: 'Test Owner',
          },
        },
        checkIn: new Date('2024-01-01'),
        checkOut: new Date('2024-01-04'),
      });

      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment123',
        bookingId: 'booking123',
        userId: 'user123',
        ownerId: 'owner123',
        amount: 3000,
        currency: 'INR',
        upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+booking123',
        status: 'AWAITING_PAYMENT',
        createdAt: new Date(),
      });

      (AuditLogger.logPaymentCreation as jest.Mock).mockResolvedValue(undefined);

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentId: 'payment123',
          bookingId: 'booking123',
          amount: 3000,
          currency: 'INR',
          upiUri: expect.any(String),
          status: 'AWAITING_PAYMENT',
        }),
      });
    });

    it('should return error if booking not found', async () => {
      const paymentData = {
        bookingId: 'nonexistent-booking',
        amount: 3000,
      };

      mockReq.body = paymentData;

      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment' },
      });
    });

    it('should return error if payment already exists', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 3000,
      };

      mockReq.body = paymentData;

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        status: 'PENDING',
        property: {
          id: 'property123',
          ownerId: 'owner123',
          name: 'Test Property',
          price: 1000,
          owner: {
            email: 'owner@test.com',
            name: 'Test Owner',
          },
        },
        checkIn: new Date('2024-01-01'),
        checkOut: new Date('2024-01-04'),
      });

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'existing-payment',
        bookingId: 'booking123',
      });

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_EXISTS', message: 'Payment already initiated for this booking' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const paymentData = {
        bookingId: 'booking123',
        amount: 3000,
      };

      mockReq.body = paymentData;
      mockReq.currentUser = { id: 'differentUser', role: 'TENANT' };

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        status: 'PENDING',
        property: {
          id: 'property123',
          ownerId: 'owner123',
          name: 'Test Property',
          price: 1000,
          owner: {
            email: 'owner@test.com',
            name: 'Test Owner',
          },
        },
        checkIn: new Date('2024-01-01'),
        checkOut: new Date('2024-01-04'),
      });

      await PaymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found or not eligible for payment' },
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const confirmData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
        upiReference: 'UPI123',
      };

      mockReq.body = confirmData;
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        bookingId: 'booking123',
        status: 'AWAITING_PAYMENT',
        amount: 3000,
      });

      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment123',
        status: 'AWAITING_OWNER_VERIFICATION',
        upiReference: 'UPI123',
        updatedAt: new Date(),
      });

      (AuditLogger.logPaymentConfirmation as jest.Mock).mockResolvedValue(undefined);

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentId: 'payment123',
          status: 'AWAITING_OWNER_VERIFICATION',
          upiReference: 'UPI123',
        }),
        message: 'Payment confirmation submitted. Waiting for owner verification.',
      });
    });

    it('should return error if payment not found', async () => {
      const confirmData = {
        paymentId: 'nonexistent-payment',
        transactionId: 'TXN123',
      };

      mockReq.body = confirmData;

      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for confirmation' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const confirmData = {
        paymentId: 'payment123',
        transactionId: 'TXN123',
      };

      mockReq.body = confirmData;
      mockReq.currentUser = { id: 'differentUser', role: 'TENANT' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        bookingId: 'booking123',
        status: 'AWAITING_PAYMENT',
        amount: 3000,
      });

      await PaymentController.confirmPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for confirmation' },
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const verifyData = {
        paymentId: 'payment123',
        action: 'verify',
        reason: 'Payment verified',
      };

      mockReq.body = verifyData;
      mockReq.currentUser = { id: 'owner123', role: 'OWNER' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'AWAITING_OWNER_VERIFICATION',
        amount: 3000,
        booking: {
          id: 'booking123',
          status: 'PENDING',
          property: {
            id: 'property123',
            name: 'Test Property',
          },
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
        },
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'user@test.com',
        },
      });

      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment123',
        status: 'VERIFIED',
        verifiedBy: 'owner123',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice123',
        invoiceNo: 'INV-123',
        bookingId: 'booking123',
        paymentId: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        amount: 3000,
        status: 'PAID',
        lineItems: [{ description: 'Accommodation', amount: 3000 }],
      });

      mockPrisma.booking.update.mockResolvedValue({
        id: 'booking123',
        status: 'CONFIRMED',
      });

      (AuditLogger.logInvoiceGeneration as jest.Mock).mockResolvedValue(undefined);
      (AuditLogger.logBookingStatusChange as jest.Mock).mockResolvedValue(undefined);
      (AuditLogger.logPaymentVerification as jest.Mock).mockResolvedValue(undefined);

      (generateInvoicePdf as jest.Mock).mockResolvedValue('file123');

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentId: 'payment123',
          status: 'VERIFIED',
          verifiedBy: 'owner123',
          verifiedAt: expect.any(Date),
          invoice: expect.objectContaining({
            id: 'invoice123',
            invoiceNo: 'INV-123',
            status: 'PAID',
          }),
          booking: expect.objectContaining({
            id: 'booking123',
            status: 'CONFIRMED',
          }),
        }),
        message: 'Payment verified and invoice generated',
      });
    });

    it('should reject payment successfully', async () => {
      const verifyData = {
        paymentId: 'payment123',
        action: 'reject',
        reason: 'Payment rejected',
      };

      mockReq.body = verifyData;
      mockReq.currentUser = { id: 'owner123', role: 'OWNER' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'AWAITING_OWNER_VERIFICATION',
        amount: 3000,
        booking: {
          id: 'booking123',
          status: 'PENDING',
          property: {
            id: 'property123',
            name: 'Test Property',
          },
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
        },
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'user@test.com',
        },
      });

      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment123',
        status: 'REJECTED',
        verifiedBy: 'owner123',
        verifiedAt: new Date(),
        updatedAt: new Date(),
        rejectionReason: 'Payment rejected',
      });

      (AuditLogger.logPaymentVerification as jest.Mock).mockResolvedValue(undefined);

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentId: 'payment123',
          status: 'REJECTED',
          verifiedBy: 'owner123',
          verifiedAt: expect.any(Date),
          invoice: null,
          booking: null,
        }),
        message: 'Payment rejected',
      });
    });

    it('should return error if payment not found', async () => {
      const verifyData = {
        paymentId: 'nonexistent-payment',
        action: 'verify',
        reason: 'Payment verified',
      };

      mockReq.body = verifyData;

      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for verification' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const verifyData = {
        paymentId: 'payment123',
        action: 'verify',
        reason: 'Payment verified',
      };

      mockReq.body = verifyData;
      mockReq.currentUser = { id: 'differentOwner', role: 'OWNER' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'AWAITING_OWNER_VERIFICATION',
        amount: 3000,
      });

      await PaymentController.verifyPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for verification' },
      });
    });
  });

  describe('getPayment', () => {
    it('should get payment successfully', async () => {
      const paymentId = 'payment123';

      mockReq.params = { paymentId };
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        amount: 3000,
        status: 'VERIFIED',
        booking: {
          id: 'booking123',
          property: {
            id: 'property123',
            name: 'Test Property',
          },
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
        },
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'user@test.com',
        },
        owner: {
          id: 'owner123',
          name: 'Test Owner',
          email: 'owner@test.com',
        },
        invoice: {
          id: 'invoice123',
          invoiceNo: 'INV-123',
          status: 'PAID',
        },
      });

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          amount: 3000,
          status: 'VERIFIED',
        }),
      });
    });

    it('should return error if payment not found', async () => {
      const paymentId = 'nonexistent-payment';

      mockReq.params = { paymentId };

      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const paymentId = 'payment123';

      mockReq.params = { paymentId };
      mockReq.currentUser = { id: 'unauthorizedUser', role: 'TENANT' };

      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        amount: 3000,
        status: 'VERIFIED',
      });

      await PaymentController.getPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view this payment' },
      });
    });
  });

  describe('getPaymentsByBooking', () => {
    it('should get payments by booking successfully', async () => {
      const bookingId = 'booking123';

      mockReq.params = { bookingId };
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
      });

      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          amount: 3000,
          status: 'VERIFIED',
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
          owner: {
            id: 'owner123',
            name: 'Test Owner',
            email: 'owner@test.com',
          },
          invoice: {
            id: 'invoice123',
            invoiceNo: 'INV-123',
            status: 'PAID',
          },
        },
      ]);

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            amount: 3000,
            status: 'VERIFIED',
          }),
        ]),
      });
    });

    it('should return error if booking not found', async () => {
      const bookingId = 'nonexistent-booking';

      mockReq.params = { bookingId };

      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const bookingId = 'booking123';

      mockReq.params = { bookingId };
      mockReq.currentUser = { id: 'unauthorizedUser', role: 'TENANT' };

      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
      });

      await PaymentController.getPaymentsByBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view payments for this booking' },
      });
    });
  });

  describe('getOwnerPayments', () => {
    it('should get owner payments successfully', async () => {
      const ownerId = 'owner123';

      mockReq.params = { ownerId };
      mockReq.currentUser = { id: 'owner123', role: 'OWNER' };

      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          amount: 3000,
          status: 'VERIFIED',
          booking: {
            id: 'booking123',
            property: {
              id: 'property123',
              name: 'Test Property',
            },
            user: {
              id: 'user123',
              name: 'Test User',
              email: 'user@test.com',
            },
          },
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
          owner: {
            id: 'owner123',
            name: 'Test Owner',
            email: 'owner@test.com',
          },
          invoice: {
            id: 'invoice123',
            invoiceNo: 'INV-123',
            status: 'PAID',
          },
        },
      ]);

      await PaymentController.getOwnerPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            amount: 3000,
            status: 'VERIFIED',
          }),
        ]),
      });
    });

    it('should return error if user is not authorized', async () => {
      const ownerId = 'owner123';

      mockReq.params = { ownerId };
      mockReq.currentUser = { id: 'differentOwner', role: 'OWNER' };

      await PaymentController.getOwnerPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view these payments' },
      });
    });
  });

  describe('getTenantPayments', () => {
    it('should get tenant payments successfully', async () => {
      const userId = 'user123';

      mockReq.params = { userId };
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 'payment123',
          userId: 'user123',
          ownerId: 'owner123',
          bookingId: 'booking123',
          amount: 3000,
          status: 'VERIFIED',
          booking: {
            id: 'booking123',
            property: {
              id: 'property123',
              name: 'Test Property',
            },
            user: {
              id: 'user123',
              name: 'Test User',
              email: 'user@test.com',
            },
          },
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
          },
          owner: {
            id: 'owner123',
            name: 'Test Owner',
            email: 'owner@test.com',
          },
          invoice: {
            id: 'invoice123',
            invoiceNo: 'INV-123',
            status: 'PAID',
          },
        },
      ]);

      await PaymentController.getTenantPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'payment123',
            userId: 'user123',
            ownerId: 'owner123',
            bookingId: 'booking123',
            amount: 3000,
            status: 'VERIFIED',
          }),
        ]),
      });
    });

    it('should return error if user is not authorized', async () => {
      const userId = 'user123';

      mockReq.params = { userId };
      mockReq.currentUser = { id: 'differentUser', role: 'TENANT' };

      await PaymentController.getTenantPayments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized to view these payments' },
      });
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const refundData = {
        paymentId: 'payment123',
        amount: 1500,
        reason: 'Customer request',
      };

      mockReq.body = refundData;
      mockReq.currentUser = { id: 'owner123', role: 'OWNER' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'VERIFIED',
        amount: 3000,
        booking: {
          id: 'booking123',
        },
      });

      mockPrisma.refund.create.mockResolvedValue({
        id: 'refund123',
        paymentId: 'payment123',
        amount: 1500,
        reason: 'Customer request',
        status: 'PENDING',
        processedBy: 'owner123',
      });

      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment123',
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: 1500,
        refundReason: 'Customer request',
      });

      (AuditLogger.logPaymentVerification as jest.Mock).mockResolvedValue(undefined);

      await PaymentController.refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          refundId: 'refund123',
          paymentId: 'payment123',
          amount: 1500,
          reason: 'Customer request',
          status: 'PENDING',
        }),
        message: 'Refund processed successfully',
      });
    });

    it('should return error if payment not found', async () => {
      const refundData = {
        paymentId: 'nonexistent-payment',
        amount: 1500,
        reason: 'Customer request',
      };

      mockReq.body = refundData;

      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await PaymentController.refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for refund' },
      });
    });

    it('should return error if refund amount exceeds payment amount', async () => {
      const refundData = {
        paymentId: 'payment123',
        amount: 3500, // More than payment amount (3000)
        reason: 'Customer request',
      };

      mockReq.body = refundData;

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'VERIFIED',
        amount: 3000,
        booking: {
          id: 'booking123',
        },
      });

      await PaymentController.refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_REFUND_AMOUNT', message: 'Refund amount cannot exceed payment amount' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const refundData = {
        paymentId: 'payment123',
        amount: 1500,
        reason: 'Customer request',
      };

      mockReq.body = refundData;
      mockReq.currentUser = { id: 'differentOwner', role: 'OWNER' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
        bookingId: 'booking123',
        status: 'VERIFIED',
        amount: 3000,
        booking: {
          id: 'booking123',
        },
      });

      await PaymentController.refundPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found or not eligible for refund' },
      });
    });
  });

  describe('getPaymentAuditLogs', () => {
    it('should get payment audit logs successfully', async () => {
      const paymentId = 'payment123';

      mockReq.params = { paymentId };
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
      });

      (AuditLogger.getPaymentAuditLogs as jest.Mock).mockResolvedValue([
        {
          id: 'audit123',
          action: 'PAYMENT_CREATED',
          details: 'Payment created',
          createdAt: new Date(),
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
            role: 'TENANT',
          },
        },
      ]);

      await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'audit123',
            action: 'PAYMENT_CREATED',
            details: 'Payment created',
          }),
        ]),
      });
    });

    it('should return error if payment not found', async () => {
      const paymentId = 'nonexistent-payment';

      mockReq.params = { paymentId };

      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const paymentId = 'payment123';

      mockReq.params = { paymentId };
      mockReq.currentUser = { id: 'unauthorizedUser', role: 'TENANT' };

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment123',
        userId: 'user123',
        ownerId: 'owner123',
      });

      await PaymentController.getPaymentAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' },
      });
    });
  });

  describe('getBookingAuditLogs', () => {
    it('should get booking audit logs successfully', async () => {
      const bookingId = 'booking123';

      mockReq.params = { bookingId };
      mockReq.currentUser = { id: 'user123', role: 'TENANT' };

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        property: {
          ownerId: 'owner123',
        },
      });

      (AuditLogger.getBookingAuditLogs as jest.Mock).mockResolvedValue([
        {
          id: 'audit123',
          action: 'BOOKING_CREATED',
          details: 'Booking created',
          createdAt: new Date(),
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'user@test.com',
            role: 'TENANT',
          },
        },
      ]);

      await PaymentController.getBookingAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'audit123',
            action: 'BOOKING_CREATED',
            details: 'Booking created',
          }),
        ]),
      });
    });

    it('should return error if booking not found', async () => {
      const bookingId = 'nonexistent-booking';

      mockReq.params = { bookingId };

      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await PaymentController.getBookingAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' },
      });
    });

    it('should return error if user is not authorized', async () => {
      const bookingId = 'booking123';

      mockReq.params = { bookingId };
      mockReq.currentUser = { id: 'unauthorizedUser', role: 'TENANT' };

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        userId: 'user123',
        property: {
          ownerId: 'owner123',
        },
      });

      await PaymentController.getBookingAuditLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' },
      });
    });
  });
});