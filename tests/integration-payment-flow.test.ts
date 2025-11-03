import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../server/server.js'

const prisma = new PrismaClient()

describe('UPI Payment Integration Tests', () => {
  let tenantUser: any
  let ownerUser: any
  let property: any
  let booking: any
  let tenantToken: string
  let ownerToken: string

  beforeAll(async () => {
    // Create test users
    tenantUser = await prisma.user.create({
      data: {
        email: 'tenant-integration@test.com',
        password: 'hashedpass',
        name: 'Test Tenant Integration',
        role: 'TENANT'
      }
    })

    ownerUser = await prisma.user.create({
      data: {
        email: 'owner-integration@test.com',
        password: 'hashedpass',
        name: 'Test Owner Integration',
        role: 'OWNER'
      }
    })

    // Create test property
    property = await prisma.property.create({
      data: {
        ownerId: ownerUser.id,
        name: 'Test Property Integration',
        address: '123 Test St',
        price: 100.0,
        capacity: 2
      }
    })

    // Mock tokens (in real scenario, these would come from login)
    tenantToken = 'mock-tenant-token'
    ownerToken = 'mock-owner-token'
  })

  afterAll(async () => {
    await prisma.invoice.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.property.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Complete Payment Flow: Create → Confirm → Verify → Invoice', () => {
    it('should complete full payment flow from booking to invoice generation', async () => {
      // Step 1: Tenant creates booking
      const bookingResponse = await request(app)
        .post('/api/bookings') // Assuming booking creation endpoint exists
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2024-02-01',
          checkOut: '2024-02-03'
        })

      expect(bookingResponse.status).toBe(201)
      booking = bookingResponse.body.data

      // Step 2: Tenant creates payment
      const createPaymentResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: booking.id })

      expect(createPaymentResponse.status).toBe(201)
      const { paymentId, upiUri, qrCode, amount } = createPaymentResponse.body.data
      expect(upiUri).toContain('upi://pay')
      expect(amount).toBe(20000) // 2 nights * 100 * 100 paisa

      // Step 3: Tenant confirms payment
      const confirmResponse = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          paymentId,
          upiReference: 'UPI123456789'
        })

      expect(confirmResponse.status).toBe(200)
      expect(confirmResponse.body.data.status).toBe('AWAITING_OWNER_VERIFICATION')

      // Step 4: Owner verifies payment
      const verifyResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentId,
          action: 'verify'
        })

      expect(verifyResponse.status).toBe(200)
      expect(verifyResponse.body.data.status).toBe('VERIFIED')
      expect(verifyResponse.body.data.invoice).toBeDefined()
      expect(verifyResponse.body.data.booking.status).toBe('CONFIRMED')

      // Step 5: Verify invoice was generated
      const invoice = verifyResponse.body.data.invoice
      expect(invoice.invoiceNo).toMatch(/^INV-\d+-[A-F0-9]{8}$/)
      expect(invoice.amount).toBe(20000)

      // Step 6: Verify booking status was updated
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id }
      })
      expect(updatedBooking?.status).toBe('CONFIRMED')

      // Step 7: Verify audit logs were created
      const auditLogs = await request(app)
        .get(`/api/payments/${paymentId}/audit`)
        .set('Authorization', `Bearer ${tenantToken}`)

      expect(auditLogs.status).toBe(200)
      const logs = auditLogs.body.data
      expect(logs.some((log: any) => log.action === 'PAYMENT_CREATED')).toBe(true)
      expect(logs.some((log: any) => log.action === 'PAYMENT_CONFIRMED')).toBe(true)
      expect(logs.some((log: any) => log.action === 'PAYMENT_VERIFIED')).toBe(true)
      expect(logs.some((log: any) => log.action === 'INVOICE_GENERATED')).toBe(true)
      expect(logs.some((log: any) => log.action === 'BOOKING_STATUS_CHANGED')).toBe(true)
    })
  })

  describe('Payment Rejection Flow: Create → Confirm → Reject → Booking Stays Pending', () => {
    it('should handle payment rejection and keep booking pending', async () => {
      // Step 1: Create booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2024-03-01',
          checkOut: '2024-03-02'
        })

      expect(bookingResponse.status).toBe(201)
      const rejectionBooking = bookingResponse.body.data

      // Step 2: Create payment
      const createPaymentResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: rejectionBooking.id })

      expect(createPaymentResponse.status).toBe(201)
      const { paymentId } = createPaymentResponse.body.data

      // Step 3: Confirm payment
      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ paymentId })

      // Step 4: Owner rejects payment
      const rejectResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentId,
          action: 'reject',
          reason: 'Invalid transaction amount'
        })

      expect(rejectResponse.status).toBe(200)
      expect(rejectResponse.body.data.status).toBe('REJECTED')
      expect(rejectResponse.body.data.invoice).toBeNull()
      expect(rejectResponse.body.data.booking).toBeNull()

      // Step 5: Verify booking status remains PENDING
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: rejectionBooking.id }
      })
      expect(updatedBooking?.status).toBe('PENDING')

      // Step 6: Verify no invoice was created
      const invoices = await prisma.invoice.findMany({
        where: { paymentId }
      })
      expect(invoices.length).toBe(0)

      // Step 7: Verify audit logs for rejection
      const auditLogs = await request(app)
        .get(`/api/payments/${paymentId}/audit`)
        .set('Authorization', `Bearer ${tenantToken}`)

      expect(auditLogs.status).toBe(200)
      const logs = auditLogs.body.data
      expect(logs.some((log: any) => log.action === 'PAYMENT_REJECTED')).toBe(true)
      const rejectionLog = logs.find((log: any) => log.action === 'PAYMENT_REJECTED')
      expect(rejectionLog.details).toContain('Invalid transaction amount')
    })
  })

  describe('Owner Dashboard Integration', () => {
    let pendingPayment: any

    beforeAll(async () => {
      // Create a booking and payment for dashboard testing
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2024-04-01',
          checkOut: '2024-04-02'
        })

      const dashboardBooking = bookingResponse.body.data

      const createPaymentResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: dashboardBooking.id })

      pendingPayment = createPaymentResponse.body.data

      // Confirm to make it pending verification
      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ paymentId: pendingPayment.paymentId })
    })

    it('should list pending payments for owner dashboard', async () => {
      const pendingResponse = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer ${ownerToken}`)

      expect(pendingResponse.status).toBe(200)
      expect(pendingResponse.body.success).toBe(true)
      expect(Array.isArray(pendingResponse.body.data)).toBe(true)

      const foundPayment = pendingResponse.body.data.find((p: any) => p.id === pendingPayment.paymentId)
      expect(foundPayment).toBeDefined()
      expect(foundPayment.status).toBe('AWAITING_OWNER_VERIFICATION')
      expect(foundPayment.booking.property.name).toBe(property.name)
    })

    it('should allow owner to verify payment from dashboard', async () => {
      const verifyResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentId: pendingPayment.paymentId,
          action: 'verify'
        })

      expect(verifyResponse.status).toBe(200)
      expect(verifyResponse.body.data.status).toBe('VERIFIED')
    })

    it('should allow owner to reject payment from dashboard', async () => {
      // Create another pending payment
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2024-05-01',
          checkOut: '2024-05-02'
        })

      const rejectBooking = bookingResponse.body.data

      const createResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: rejectBooking.id })

      const rejectPayment = createResponse.body.data

      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ paymentId: rejectPayment.paymentId })

      // Reject from dashboard
      const rejectResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentId: rejectPayment.paymentId,
          action: 'reject',
          reason: 'Dashboard rejection test'
        })

      expect(rejectResponse.status).toBe(200)
      expect(rejectResponse.body.data.status).toBe('REJECTED')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should prevent duplicate payment creation', async () => {
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2024-06-01',
          checkOut: '2024-06-02'
        })

      const testBooking = bookingResponse.body.data

      // Create first payment
      await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: testBooking.id })

      // Attempt duplicate
      const duplicateResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: testBooking.id })

      expect(duplicateResponse.status).toBe(400)
      expect(duplicateResponse.body.error.code).toBe('PAYMENT_EXISTS')
    })

    it('should validate booking ownership', async () => {
      // Create booking for different tenant
      const otherTenant = await prisma.user.create({
        data: {
          email: 'other-tenant@test.com',
          password: 'hashedpass',
          name: 'Other Tenant',
          role: 'TENANT'
        }
      })

      const otherBooking = await prisma.booking.create({
        data: {
          userId: otherTenant.id,
          propertyId: property.id,
          checkIn: new Date('2024-07-01'),
          checkOut: new Date('2024-07-02'),
          status: 'PENDING'
        }
      })

      // Try to create payment with wrong tenant
      const invalidResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: otherBooking.id })

      expect(invalidResponse.status).toBe(404)
      expect(invalidResponse.body.error.code).toBe('BOOKING_NOT_FOUND')
    })
  })
})
