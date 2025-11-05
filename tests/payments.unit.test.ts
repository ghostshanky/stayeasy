import { PaymentsController } from '../server/controllers/paymentsController'
import { PrismaClient } from '@prisma/client'
import { AuditLogger } from '../server/audit-logger'
import { generateInvoicePdf } from '../server/utils/pdfGenerator'

// Mock the Prisma client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mPrismaClient)),
    booking: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      update: jest.fn(),
    },
    file: {
      create: jest.fn(),
    },
  }
  return { PrismaClient: jest.fn(() => mPrismaClient) }
})

// Mock other dependencies
jest.mock('../server/audit-logger')
jest.mock('../server/utils/pdfGenerator')

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient> & {
  $transaction: jest.Mock,
  booking: { findFirst: jest.Mock, update: jest.Mock },
  payment: { findFirst: jest.Mock, create: jest.Mock, update: jest.Mock },
  invoice: { create: jest.Mock, update: jest.Mock },
}

const mockRequest = (body: any, user?: any) => ({
  body,
  currentUser: user,
})

const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('PaymentsController Unit Tests', () => {
  let req: any
  let res: any

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
  })

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      req = mockRequest({ bookingId: 'booking_cuid' }, { id: 'user_cuid' })

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking_cuid',
        userId: 'user_cuid',
        status: 'PENDING',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000), // 1 day later
        property: { price: 1000, ownerId: 'owner_cuid', owner: { name: 'Owner Name', email: 'owner@upi' } }
      })
      mockPrisma.payment.findFirst.mockResolvedValue(null)
      mockPrisma.payment.create.mockResolvedValue({ id: 'payment_cuid' })

      await PaymentsController.createPayment(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ paymentId: 'payment_cuid' })
      }))
      expect(AuditLogger.logPaymentCreation).toHaveBeenCalled()
    })

    it('should return 404 if booking not found', async () => {
      req = mockRequest({ bookingId: 'booking_cuid' }, { id: 'user_cuid' })
      mockPrisma.booking.findFirst.mockResolvedValue(null)

      await PaymentsController.createPayment(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: { code: 'BOOKING_NOT_FOUND' }
      }))
    })
  })

  describe('confirmPayment', () => {
    it('should confirm a payment successfully', async () => {
      req = mockRequest({ paymentId: 'payment_cuid' }, { id: 'user_cuid' })

      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment_cuid', userId: 'user_cuid', status: 'AWAITING_PAYMENT', bookingId: 'booking_cuid' })
      mockPrisma.payment.update.mockResolvedValue({ id: 'payment_cuid', status: 'AWAITING_OWNER_VERIFICATION' })

      await PaymentsController.confirmPayment(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { paymentId: 'payment_cuid', status: 'AWAITING_OWNER_VERIFICATION' }
      }))
      expect(AuditLogger.logPaymentConfirmation).toHaveBeenCalled()
    })
  })

  describe('verifyPayment', () => {
    it('should verify a payment successfully and create an invoice', async () => {
      req = mockRequest({ paymentId: 'payment_cuid', verified: true }, { id: 'owner_cuid', role: 'OWNER' })

      mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: 'payment_cuid', ownerId: 'owner_cuid', status: 'AWAITING_OWNER_VERIFICATION' }) // For idempotency check
      mockPrisma.payment.update.mockResolvedValue({ id: 'payment_cuid', bookingId: 'booking_cuid', status: 'VERIFIED' })
      mockPrisma.booking.update.mockResolvedValue({ id: 'booking_cuid', status: 'CONFIRMED' })
      mockPrisma.invoice.create.mockResolvedValue({ id: 'invoice_cuid', invoiceNo: 'INV-123' })
      mockPrisma.invoice.update.mockResolvedValue({})
      ;(generateInvoicePdf as jest.Mock).mockResolvedValue('file_cuid')

      await PaymentsController.verifyPayment(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: 'VERIFIED', invoice: expect.any(Object) })
      }))
      expect(AuditLogger.logPaymentVerification).toHaveBeenCalled()
      expect(AuditLogger.logInvoiceGeneration).toHaveBeenCalled()
      expect(generateInvoicePdf).toHaveBeenCalled()
    })

    it('should reject a payment successfully', async () => {
      req = mockRequest({ paymentId: 'payment_cuid', verified: false, note: 'Incorrect amount' }, { id: 'owner_cuid', role: 'OWNER' })

      mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: 'payment_cuid', ownerId: 'owner_cuid', status: 'AWAITING_OWNER_VERIFICATION' })
      mockPrisma.payment.update.mockResolvedValue({ id: 'payment_cuid', status: 'REJECTED' })

      await PaymentsController.verifyPayment(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' })
      }))
      expect(AuditLogger.logPaymentVerification).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(String), 'reject', 'Incorrect amount')
    })
  })
})