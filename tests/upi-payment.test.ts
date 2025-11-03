import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../server/server.js'

const prisma = new PrismaClient()

describe('UPI Payment System', () => {
  let server: any
  let tenantUser: any
  let ownerUser: any
  let property: any
  let booking: any
  let payment: any

  beforeAll(async () => {
    // Create test users
    tenantUser = await prisma.user.create({
      data: {
        email: 'tenant@test.com',
        password: 'hashedpass',
        name: 'Test Tenant',
        role: 'TENANT'
      }
    })

    ownerUser = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        password: 'hashedpass',
        name: 'Test Owner',
        role: 'OWNER'
      }
    })

    // Create test property
    property = await prisma.property.create({
      data: {
        ownerId: ownerUser.id,
        name: 'Test Property',
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
  })

  afterAll(async () => {
    await prisma.invoice.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.property.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Payment Creation', () => {
    it('should create payment with UPI URI', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ bookingId: booking.id })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('paymentId')
      expect(response.body.data).toHaveProperty('upiUri')
      expect(response.body.data.upiUri).toContain('upi://pay')
      expect(response.body.data.status).toBe('AWAITING_PAYMENT')

      payment = response.body.data
    })

    it('should reject duplicate payment creation', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ bookingId: booking.id })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('PAYMENT_EXISTS')
    })

    it('should reject payment for non-existent booking', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ bookingId: 'non-existent-id' })

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('BOOKING_NOT_FOUND')
    })
  })

  describe('Payment Confirmation', () => {
    it('should allow tenant to confirm payment', async () => {
      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({
          paymentId: payment.paymentId,
          upiReference: 'TXN123456789'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('AWAITING_OWNER_VERIFICATION')
      expect(response.body.data.upiReference).toBe('TXN123456789')
    })

    it('should reject confirmation for non-existent payment', async () => {
      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({
          paymentId: 'non-existent-id',
          upiReference: 'TXN123'
        })

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND')
    })
  })

  describe('Payment Verification', () => {
    it('should allow owner to verify payment and generate invoice', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer mock-token-owner`)
        .send({
          paymentId: payment.paymentId,
          action: 'verify'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('VERIFIED')
      expect(response.body.data).toHaveProperty('invoice')
      expect(response.body.data.invoice).toHaveProperty('invoiceNo')
      expect(response.body.data.booking.status).toBe('CONFIRMED')
    })

    it('should allow owner to reject payment', async () => {
      // Create another payment for rejection test
      const newBooking = await prisma.booking.create({
        data: {
          userId: tenantUser.id,
          propertyId: property.id,
          checkIn: new Date('2024-03-01'),
          checkOut: new Date('2024-03-02'),
          status: 'PENDING'
        }
      })

      const newPaymentResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ bookingId: newBooking.id })

      const newPayment = newPaymentResponse.body.data

      // Confirm payment
      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ paymentId: newPayment.paymentId })

      // Reject payment
      const rejectResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer mock-token-owner`)
        .send({
          paymentId: newPayment.paymentId,
          action: 'reject',
          reason: 'Invalid transaction'
        })

      expect(rejectResponse.status).toBe(200)
      expect(rejectResponse.body.success).toBe(true)
      expect(rejectResponse.body.data.status).toBe('REJECTED')
      expect(rejectResponse.body.data.invoice).toBeNull()
    })

    it('should reject verification for invalid action', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer mock-token-owner`)
        .send({
          paymentId: payment.paymentId,
          action: 'invalid'
        })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_ACTION')
    })
  })

  describe('Pending Payments', () => {
    it('should list pending payments for owner', async () => {
      // Create another pending payment
      const anotherBooking = await prisma.booking.create({
        data: {
          userId: tenantUser.id,
          propertyId: property.id,
          checkIn: new Date('2024-04-01'),
          checkOut: new Date('2024-04-02'),
          status: 'PENDING'
        }
      })

      const pendingPaymentResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ bookingId: anotherBooking.id })

      const pendingPayment = pendingPaymentResponse.body.data

      // Confirm to make it pending verification
      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer mock-token-tenant`)
        .send({ paymentId: pendingPayment.paymentId })

      // Fetch pending payments
      const response = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer mock-token-owner`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      const foundPayment = response.body.data.find((p: any) => p.id === pendingPayment.paymentId)
      expect(foundPayment).toBeDefined()
      expect(foundPayment.status).toBe('AWAITING_OWNER_VERIFICATION')
    })
  })

  describe('UPI URI Generation', () => {
    it('should generate valid UPI URI', () => {
      const { UPIPaymentUtils } = require('../server/upi-payment.js')

      const uri = UPIPaymentUtils.generateUPIPaymentURI({
        payeeUPI: 'merchant@upi',
        payeeName: 'Test Merchant',
        amount: 1000.50,
        transactionNote: 'Test Transaction'
      })

      expect(uri).toContain('upi://pay')
      expect(uri).toContain('pa=merchant@upi')
      expect(uri).toContain('pn=Test%20Merchant')
      expect(uri).toContain('am=1000.5')
      expect(uri).toContain('tn=Test%20Transaction')
      expect(uri).toContain('cu=INR')
    })

    it('should generate unique invoice numbers', () => {
      const { UPIPaymentUtils } = require('../server/upi-payment.js')

      const invoice1 = UPIPaymentUtils.generateInvoiceNumber()
      const invoice2 = UPIPaymentUtils.generateInvoiceNumber()

      expect(invoice1).toMatch(/^INV-\d+-[A-F0-9]{8}$/)
      expect(invoice2).toMatch(/^INV-\d+-[A-F0-9]{8}$/)
      expect(invoice1).not.toBe(invoice2)
    })
  })

  describe('Invoice Generation', () => {
    it('should generate invoice HTML', () => {
      const { InvoiceGenerator } = require('../server/upi-payment.js')

      const mockInvoice = {
        id: 'inv-123',
        invoiceNo: 'INV-123',
        createdAt: new Date(),
        bookingId: 'book-123',
        paymentId: 'pay-123',
        user: { name: 'John Doe', email: 'john@example.com' },
        owner: { name: 'Jane Owner', email: 'jane@example.com' },
        booking: {
          property: { name: 'Test Property' },
          checkIn: new Date('2024-01-01'),
          checkOut: new Date('2024-01-02')
        },
        amount: 100000, // 1000 INR in paisa
        status: 'PAID',
        lineItems: [
          { description: 'Accommodation', amount: 100000 }
        ]
      }

      const html = InvoiceGenerator.generateInvoiceHTML(mockInvoice)

      expect(html).toContain('StayEasy Invoice')
      expect(html).toContain('INV-123')
      expect(html).toContain('John Doe')
      expect(html).toContain('Jane Owner')
      expect(html).toContain('₹1000.00')
    })
  })
})
