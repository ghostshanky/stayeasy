import request from 'supertest'
import app from '../server/server.js' // Your Express app
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../server/auth.js'

const prisma = new PrismaClient()

describe('Payments API - Full Integration Flow', () => {
  let tenantToken: string
  let ownerToken: string
  let tenantUser: any
  let ownerUser: any
  let property: any
  let booking: any

  beforeAll(async () => {
    // 1. Create users (tenant, owner)
    tenantUser = await AuthService.createUser('payment-tenant@test.com', 'password123', 'Payment Tenant', 'TENANT')
    ownerUser = await AuthService.createUser('payment-owner@test.com', 'password123', 'Payment Owner', 'OWNER')

    // 2. Log them in to get tokens
    const tenantSession = await AuthService.createSession(tenantUser)
    tenantToken = tenantSession.accessToken

    const ownerSession = await AuthService.createSession(ownerUser)
    ownerToken = ownerSession.accessToken

    // 3. Create a property for the owner
    property = await prisma.property.create({
      data: {
        name: 'Payment Test Property',
        address: '123 Test Lane',
        price: 5000,
        capacity: 2,
        ownerId: ownerUser.id,
      },
    })

    // 4. Create a booking for the tenant
    booking = await prisma.booking.create({
      data: {
        userId: tenantUser.id,
        propertyId: property.id,
        checkIn: new Date('2025-01-10'),
        checkOut: new Date('2025-01-12'),
        status: 'PENDING',
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } })
    await prisma.property.deleteMany({ where: { id: property.id } })
    // Other data will be cascade deleted
    await prisma.$disconnect()
  })

  let paymentId: string

  test('Step 1: Tenant should create a payment', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ bookingId: booking.id })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.paymentId).toBeDefined()
    expect(res.body.data.upiUri).toContain('upi://pay')
    expect(res.body.data.qrDataUrl).toContain('data:image/png;base64')

    paymentId = res.body.data.paymentId

    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } })
    expect(dbPayment?.status).toBe('AWAITING_PAYMENT')
    expect(dbPayment?.amount).toBe(1000000) // 5000 * 2 nights * 100 paisa
  })

  test('Step 2: Tenant should confirm the payment', async () => {
    const upiReference = `UPI-REF-${Date.now()}`
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ paymentId, upiReference })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('AWAITING_OWNER_VERIFICATION')

    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } })
    expect(dbPayment?.status).toBe('AWAITING_OWNER_VERIFICATION')
    expect(dbPayment?.upiReference).toBe(upiReference)
  })

  test('Step 3: Owner should see the payment in their pending list', async () => {
    const res = await request(app)
      .get('/api/payments/pending')
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    const foundPayment = res.body.data.find((p: any) => p.id === paymentId)
    expect(foundPayment).toBeDefined()
    expect(foundPayment.status).toBe('AWAITING_OWNER_VERIFICATION')
  })

  test('Step 4: Owner should verify the payment', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ paymentId, verified: true })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('VERIFIED')
    expect(res.body.data.invoice).toBeDefined()
    expect(res.body.data.booking.status).toBe('CONFIRMED')

    // Verify DB state
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } })
    expect(dbPayment?.status).toBe('VERIFIED')

    const dbBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(dbBooking?.status).toBe('CONFIRMED')

    const dbInvoice = await prisma.invoice.findFirst({ where: { paymentId } })
    expect(dbInvoice).toBeDefined()
    expect(dbInvoice?.pdfFileId).toBeDefined()
  })

  test('Step 5: Verification should be idempotent', async () => {
    // Try to verify again
    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ paymentId, verified: true })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Payment was already verified')

    // Ensure no duplicate invoice was created
    const invoiceCount = await prisma.invoice.count({ where: { paymentId } })
    expect(invoiceCount).toBe(1)
  })

  describe('Rejection Flow', () => {
    let rejectionPaymentId: string

    beforeAll(async () => {
      // Create a new booking and payment to test rejection
      const newBooking = await prisma.booking.create({ data: { ...booking, id: undefined, status: 'PENDING' } })
      const paymentRes = await request(app).post('/api/payments/create').set('Authorization', `Bearer ${tenantToken}`).send({ bookingId: newBooking.id })
      rejectionPaymentId = paymentRes.body.data.paymentId
      await request(app).post('/api/payments/confirm').set('Authorization', `Bearer ${tenantToken}`).send({ paymentId: rejectionPaymentId })
    })

    test('Owner should reject a payment', async () => {
      const note = 'Amount mismatch'
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ paymentId: rejectionPaymentId, verified: false, note })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('REJECTED')

      const dbPayment = await prisma.payment.findUnique({ where: { id: rejectionPaymentId } })
      expect(dbPayment?.status).toBe('REJECTED')
      expect(dbPayment?.rejectionReason).toBe(note)
    })
  })
})