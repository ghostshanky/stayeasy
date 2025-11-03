import { PrismaClient } from '@prisma/client'
import { AuditLogger } from '../server/audit-logger.js'

const prisma = new PrismaClient()

describe('AuditLogger', () => {
  let tenantUser: any
  let ownerUser: any
  let booking: any
  let payment: any

  beforeAll(async () => {
    // Create test users
    tenantUser = await prisma.user.create({
      data: {
        email: 'tenant-audit@test.com',
        password: 'hashedpass',
        name: 'Test Tenant Audit',
        role: 'TENANT'
      }
    })

    ownerUser = await prisma.user.create({
      data: {
        email: 'owner-audit@test.com',
        password: 'hashedpass',
        name: 'Test Owner Audit',
        role: 'OWNER'
      }
    })

    // Create test property
    const property = await prisma.property.create({
      data: {
        ownerId: ownerUser.id,
        name: 'Test Property Audit',
        address: '123 Test St',
        price: 100.0,
        capacity: 2
      }
    })

    // Create test booking
    booking = await prisma.booking.create({
      data: {
        userId: tenantUser.id,
        propertyId: property.id,
        checkIn: new Date('2024-02-01'),
        checkOut: new Date('2024-02-03'),
        status: 'PENDING'
      }
    })

    // Create test payment
    payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: tenantUser.id,
        ownerId: ownerUser.id,
        amount: 20000, // 200 INR
        currency: 'INR',
        upiUri: 'upi://pay?pa=test@upi&pn=Test&am=200&tn=Test',
        status: 'AWAITING_PAYMENT'
      }
    })
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.property.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Payment Creation Audit', () => {
    it('should log payment creation', async () => {
      await AuditLogger.logPaymentCreation(
        tenantUser.id,
        booking.id,
        payment.id,
        payment.amount
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const creationLog = logs.find(log => log.action === 'PAYMENT_CREATED')

      expect(creationLog).toBeDefined()
      expect(creationLog?.userId).toBe(tenantUser.id)
      expect(creationLog?.actorId).toBe(tenantUser.id)
      expect(creationLog?.bookingId).toBe(booking.id)
      expect(creationLog?.paymentId).toBe(payment.id)
      expect(creationLog?.details).toContain('Payment created for booking')
      expect(creationLog?.details).toContain('₹200.00')
    })
  })

  describe('Payment Confirmation Audit', () => {
    it('should log payment confirmation with UPI reference', async () => {
      const upiReference = 'UPI123456789'

      await AuditLogger.logPaymentConfirmation(
        tenantUser.id,
        booking.id,
        payment.id,
        upiReference
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const confirmationLog = logs.find(log => log.action === 'PAYMENT_CONFIRMED')

      expect(confirmationLog).toBeDefined()
      expect(confirmationLog?.userId).toBe(tenantUser.id)
      expect(confirmationLog?.actorId).toBe(tenantUser.id)
      expect(confirmationLog?.bookingId).toBe(booking.id)
      expect(confirmationLog?.paymentId).toBe(payment.id)
      expect(confirmationLog?.details).toContain('Tenant confirmed payment')
      expect(confirmationLog?.details).toContain(upiReference)
    })

    it('should log payment confirmation without UPI reference', async () => {
      await AuditLogger.logPaymentConfirmation(
        tenantUser.id,
        booking.id,
        payment.id
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const confirmationLogs = logs.filter(log => log.action === 'PAYMENT_CONFIRMED')

      expect(confirmationLogs.length).toBeGreaterThan(1)
      const lastConfirmationLog = confirmationLogs[confirmationLogs.length - 1]
      expect(lastConfirmationLog.details).toContain('Tenant confirmed payment')
    })
  })

  describe('Payment Verification Audit', () => {
    it('should log payment verification', async () => {
      await AuditLogger.logPaymentVerification(
        ownerUser.id,
        booking.id,
        payment.id,
        'verify'
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const verificationLog = logs.find(log => log.action === 'PAYMENT_VERIFIED')

      expect(verificationLog).toBeDefined()
      expect(verificationLog?.userId).toBe(ownerUser.id)
      expect(verificationLog?.actorId).toBe(ownerUser.id)
      expect(verificationLog?.bookingId).toBe(booking.id)
      expect(verificationLog?.paymentId).toBe(payment.id)
      expect(verificationLog?.details).toContain('Owner verified payment')
    })

    it('should log payment rejection with reason', async () => {
      const reason = 'Invalid transaction amount'

      await AuditLogger.logPaymentVerification(
        ownerUser.id,
        booking.id,
        payment.id,
        'reject',
        reason
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const rejectionLog = logs.find(log => log.action === 'PAYMENT_REJECTED')

      expect(rejectionLog).toBeDefined()
      expect(rejectionLog?.userId).toBe(ownerUser.id)
      expect(rejectionLog?.actorId).toBe(ownerUser.id)
      expect(rejectionLog?.bookingId).toBe(booking.id)
      expect(rejectionLog?.paymentId).toBe(payment.id)
      expect(rejectionLog?.details).toContain('Owner rejected payment')
      expect(rejectionLog?.details).toContain(reason)
    })
  })

  describe('Invoice Generation Audit', () => {
    it('should log invoice generation', async () => {
      const invoiceId = 'inv-test-123'
      const invoiceNo = 'INV-123456789-ABCD'

      await AuditLogger.logInvoiceGeneration(
        ownerUser.id,
        booking.id,
        payment.id,
        invoiceId,
        invoiceNo
      )

      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)
      const invoiceLog = logs.find(log => log.action === 'INVOICE_GENERATED')

      expect(invoiceLog).toBeDefined()
      expect(invoiceLog?.userId).toBe(ownerUser.id)
      expect(invoiceLog?.actorId).toBe(ownerUser.id)
      expect(invoiceLog?.bookingId).toBe(booking.id)
      expect(invoiceLog?.paymentId).toBe(payment.id)
      expect(invoiceLog?.details).toContain(`Invoice ${invoiceNo} generated`)
    })
  })

  describe('Booking Status Change Audit', () => {
    it('should log booking status changes', async () => {
      await AuditLogger.logBookingStatusChange(
        ownerUser.id,
        booking.id,
        'PENDING',
        'CONFIRMED'
      )

      const logs = await AuditLogger.getBookingAuditLogs(booking.id)
      const statusChangeLog = logs.find(log => log.action === 'BOOKING_STATUS_CHANGED')

      expect(statusChangeLog).toBeDefined()
      expect(statusChangeLog?.userId).toBe(ownerUser.id)
      expect(statusChangeLog?.actorId).toBe(ownerUser.id)
      expect(statusChangeLog?.bookingId).toBe(booking.id)
      expect(statusChangeLog?.details).toContain('status changed from PENDING to CONFIRMED')
    })
  })

  describe('Audit Log Retrieval', () => {
    it('should retrieve payment audit logs in chronological order', async () => {
      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)

      expect(logs.length).toBeGreaterThan(0)
      // Check chronological order (most recent first in the query, but we expect creation first)
      const creationLog = logs.find(log => log.action === 'PAYMENT_CREATED')
      const verificationLog = logs.find(log => log.action === 'PAYMENT_VERIFIED')

      if (creationLog && verificationLog) {
        expect(creationLog.createdAt.getTime()).toBeLessThan(verificationLog.createdAt.getTime())
      }
    })

    it('should retrieve booking audit logs', async () => {
      const logs = await AuditLogger.getBookingAuditLogs(booking.id)

      expect(logs.length).toBeGreaterThan(0)
      const statusChangeLog = logs.find(log => log.action === 'BOOKING_STATUS_CHANGED')
      expect(statusChangeLog).toBeDefined()
    })

    it('should retrieve user audit logs with limit', async () => {
      const logs = await AuditLogger.getUserAuditLogs(ownerUser.id, 10)

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.length).toBeLessThanOrEqual(10)

      // All logs should be for this actor
      logs.forEach(log => {
        expect(log.actorId).toBe(ownerUser.id)
      })
    })

    it('should include user details in audit logs', async () => {
      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)

      logs.forEach(log => {
        if (log.user) {
          expect(log.user).toHaveProperty('id')
          expect(log.user).toHaveProperty('name')
          expect(log.user).toHaveProperty('email')
          expect(log.user).toHaveProperty('role')
        }
      })
    })
  })

  describe('Audit Log Actions', () => {
    it('should have correct action types', () => {
      // Test that all expected actions are logged
      const expectedActions = [
        'PAYMENT_CREATED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_VERIFIED',
        'PAYMENT_REJECTED',
        'INVOICE_GENERATED',
        'BOOKING_STATUS_CHANGED'
      ]

      // This is more of a documentation test - ensuring our actions match expectations
      expectedActions.forEach(action => {
        expect(action).toMatch(/^[A-Z_]+$/)
      })
    })

    it('should store detailed information in audit logs', async () => {
      const logs = await AuditLogger.getPaymentAuditLogs(payment.id)

      logs.forEach(log => {
        expect(log.details).toBeDefined()
        expect(typeof log.details).toBe('string')
        expect(log.details.length).toBeGreaterThan(0)
      })
    })
  })
})
