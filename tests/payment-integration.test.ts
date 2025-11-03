import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { upiPaymentRoutes } from '../server/upi-payment-with-audit';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'StayEasy API Server is running' });
});

describe('Payment Integration Tests', () => {
  let testUser: any;
  let testOwner: any;
  let testProperty: any;
  let testBooking: any;

  beforeAll(async () => {
    // Create test user (tenant)
    testUser = await prisma.user.create({
      data: {
        email: 'tenant@test.com',
        password: 'hashedpassword',
        name: 'Test Tenant',
        role: 'TENANT',
      },
    });

    // Create test owner
    testOwner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        password: 'hashedpassword',
        name: 'Test Owner',
        role: 'OWNER',
      },
    });

    // Create test property
    testProperty = await prisma.property.create({
      data: {
        ownerId: testOwner.id,
        name: 'Test Property',
        address: '123 Test St',
        description: 'A beautiful test property',
        price: 1000,
        capacity: 4,
      },
    });

    // Create test booking
    const checkInDate = new Date('2024-01-01');
    const checkOutDate = new Date('2024-01-04');
    
    testBooking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        propertyId: testProperty.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: 'PENDING',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { userId: testUser.id },
          { property: { ownerId: testOwner.id } },
        ],
      },
    });

    await prisma.property.deleteMany({
      where: { ownerId: testOwner.id },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: testUser.id },
          { id: testOwner.id },
        ],
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/payments/create', () => {
    it('should create a new payment successfully', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const paymentData = {
        bookingId: testBooking.id,
        amount: 3000,
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('upiUri');
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data.status).toBe('AWAITING_PAYMENT');
      expect(response.body.data.bookingId).toBe(testBooking.id);
    });

    it('should return error if booking not found', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const paymentData = {
        bookingId: 'nonexistent-booking',
        amount: 3000,
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOKING_NOT_FOUND');
    });

    it('should return error if user is not authenticated', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        amount: 3000,
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData);

      expect(response.status).toBe(401);
    });

    it('should return error if amount is invalid', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const paymentData = {
        bookingId: testBooking.id,
        amount: -100, // Invalid negative amount
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/confirm', () => {
    let paymentId: string;

    beforeAll(async () => {
      // Create a payment for testing
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'AWAITING_PAYMENT',
        },
      });

      paymentId = payment.id;
    });

    it('should confirm payment successfully', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const confirmData = {
        paymentId,
        upiReference: 'UPI123',
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send(confirmData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('AWAITING_OWNER_VERIFICATION');
      expect(response.body.data.upiReference).toBe('UPI123');
    });

    it('should return error if payment not found', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const confirmData = {
        paymentId: 'nonexistent-payment',
        upiReference: 'UPI123',
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send(confirmData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return error if user is not authorized', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const confirmData = {
        paymentId,
        upiReference: 'UPI123',
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send(confirmData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });
  });

  describe('POST /api/payments/verify', () => {
    let paymentId: string;

    beforeAll(async () => {
      // Create a payment for testing
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'AWAITING_OWNER_VERIFICATION',
        },
      });

      paymentId = payment.id;
    });

    it('should verify payment successfully', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const verifyData = {
        paymentId,
        action: 'verify',
        reason: 'Payment verified',
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('VERIFIED');
      expect(response.body.data.verifiedBy).toBe(testOwner.id);
      expect(response.body.data.invoice).toBeDefined();
      expect(response.body.data.booking).toBeDefined();
      expect(response.body.data.booking.status).toBe('CONFIRMED');
    });

    it('should reject payment successfully', async () => {
      // Create another payment for testing rejection
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'AWAITING_OWNER_VERIFICATION',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const verifyData = {
        paymentId: payment.id,
        action: 'reject',
        reason: 'Payment rejected',
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REJECTED');
      expect(response.body.data.verifiedBy).toBe(testOwner.id);
      expect(response.body.data.invoice).toBeNull();
      expect(response.body.data.booking).toBeNull();
    });

    it('should return error if payment not found', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const verifyData = {
        paymentId: 'nonexistent-payment',
        action: 'verify',
        reason: 'Payment verified',
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(verifyData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return error if user is not authorized', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const verifyData = {
        paymentId,
        action: 'verify',
        reason: 'Payment verified',
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(verifyData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return error if action is invalid', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const verifyData = {
        paymentId,
        action: 'invalid-action',
        reason: 'Payment verified',
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ACTION');
    });
  });

  describe('GET /api/payments/pending', () => {
    beforeAll(async () => {
      // Create a payment for testing
      await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'AWAITING_OWNER_VERIFICATION',
        },
      });
    });

    it('should get pending payments for owner', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('bookingId');
      expect(response.body.data[0]).toHaveProperty('amount');
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0].status).toBe('AWAITING_OWNER_VERIFICATION');
    });

    it('should return empty array if no pending payments', async () => {
      // Create a user with no pending payments
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password: 'hashedpassword',
          name: 'Other User',
          role: 'OWNER',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return error if user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/payments/pending');

      expect(response.status).toBe(401);
    });

    it('should return error if user is not owner', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    let paymentId: string;

    beforeAll(async () => {
      // Create a payment for testing
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'VERIFIED',
        },
      });

      paymentId = payment.id;
    });

    it('should get payment details successfully', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('bookingId');
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.id).toBe(paymentId);
    });

    it('should return error if payment not found', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/payments/nonexistent-payment')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });

    it('should return error if user is not authorized', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'unauthorized@test.com',
          password: 'hashedpassword',
          name: 'Unauthorized User',
          role: 'TENANT',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unauthorized@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit payment creation endpoint', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      // Make multiple requests to trigger rate limiting
      const requests = Array(15).fill(null).map(() => 
        request(app)
          .post('/api/payments/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            bookingId: testBooking.id,
            amount: 3000,
          })
      );

      const responses = await Promise.all(requests);
      
      // Most requests should succeed, but the last few should be rate limited
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should rate limit payment verification endpoint', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const token = loginResponse.body.data.accessToken;

      // Create a payment first
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          ownerId: testOwner.id,
          amount: 3000,
          currency: 'INR',
          upiUri: 'upi://pay?pa=owner@test.com&pn=Test+Owner&am=30.00&cu=INR&tn=StayEasy+Booking+testBooking',
          status: 'AWAITING_OWNER_VERIFICATION',
        },
      });

      // Make multiple requests to trigger rate limiting
      const requests = Array(15).fill(null).map(() => 
        request(app)
          .post('/api/payments/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({
            paymentId: payment.id,
            action: 'verify',
            reason: 'Payment verified',
          })
      );

      const responses = await Promise.all(requests);
      
      // Most requests should succeed, but the last few should be rate limited
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Full Payment Flow', () => {
    it('should complete the full payment flow successfully', async () => {
      // Step 1: Login as tenant
      const tenantLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tenant@test.com',
          password: 'password',
        });

      const tenantToken = tenantLoginResponse.body.data.accessToken;

      // Step 2: Create payment
      const createResponse = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          bookingId: testBooking.id,
          amount: 3000,
        });

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.data.paymentId;

      // Step 3: Confirm payment
      const confirmResponse = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          paymentId,
          upiReference: 'UPI123',
        });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.status).toBe('AWAITING_OWNER_VERIFICATION');

      // Step 4: Login as owner
      const ownerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password',
        });

      const ownerToken = ownerLoginResponse.body.data.accessToken;

      // Step 5: Verify payment
      const verifyResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentId,
          action: 'verify',
          reason: 'Payment verified',
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.status).toBe('VERIFIED');
      expect(verifyResponse.body.data.invoice).toBeDefined();
      expect(verifyResponse.body.data.booking.status).toBe('CONFIRMED');

      // Step 6: Get payment details
      const getResponse = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.status).toBe('VERIFIED');

      // Step 7: Get audit logs
      const auditResponse = await request(app)
        .get(`/api/payments/${paymentId}/audit`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(auditResponse.status).toBe(200);
      expect(Array.isArray(auditResponse.body.data)).toBe(true);
      expect(auditResponse.body.data.length).toBeGreaterThan(0);
    });
  });
});