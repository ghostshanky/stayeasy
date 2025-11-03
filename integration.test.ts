import request from 'supertest';
import app from '../server/server'; // Adjust if your app export is different
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../server/auth';

const prisma = new PrismaClient();

describe('API Integration Tests', () => {
  let tenantToken: string;
  let ownerToken: string;
  let tenantUser: any;
  let ownerUser: any;
  let property: any;
  let booking: any;
  let paymentId: string;
  let chatId: string;

  beforeAll(async () => {
    // 1. Create users (tenant, owner)
    tenantUser = await AuthService.createUser('integ-tenant@test.com', 'password123', 'Integ Tenant', 'TENANT');
    ownerUser = await AuthService.createUser('integ-owner@test.com', 'password123', 'Integ Owner', 'OWNER');

    // 2. Log them in to get tokens
    const tenantSession = await AuthService.createSession(tenantUser);
    tenantToken = tenantSession.accessToken;

    const ownerSession = await AuthService.createSession(ownerUser);
    ownerToken = ownerSession.accessToken;

    // 3. Create a property for the owner
    property = await prisma.property.create({
      data: {
        name: 'Integration Test Property',
        address: '123 Test Lane',
        price: 1000,
        capacity: 2,
        ownerId: ownerUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
    // The rest should be cascade deleted
    await prisma.$disconnect();
  });

  describe('Auth Flow', () => {
    it('should sign up a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'signup-test@test.com',
          password: 'password123',
          name: 'Signup Test',
          role: 'TENANT',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('userId');
    });

    it('should log in an existing user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: tenantUser.email,
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });

  describe('Booking Flow', () => {
    it('should allow a tenant to create a booking', async () => {
      const res = await request(app)
        .post('/api/bookings') // Assuming this endpoint exists
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property.id,
          checkIn: '2025-08-01',
          checkOut: '2025-08-03',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.propertyId).toBe(property.id);
      booking = res.body.data;
    });
  });

  describe('Full Payment Flow', () => {
    it('Step 1: Tenant should create a payment for the booking', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ bookingId: booking.id });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('paymentId');
      paymentId = res.body.data.paymentId;
    });

    it('Step 2: Tenant should confirm the payment', async () => {
      const res = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ paymentId, upiReference: 'INTEG-TEST-123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('AWAITING_OWNER_VERIFICATION');
    });

    it('Step 3: Owner should see the payment in their pending list', async () => {
      const res = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      const foundPayment = res.body.data.find((p: any) => p.id === paymentId);
      expect(foundPayment).toBeDefined();
    });

    it('Step 4: Owner should verify the payment, creating an invoice', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ paymentId, verified: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('VERIFIED');
      expect(res.body.data.invoice).toBeDefined();
      expect(res.body.data.booking.status).toBe('CONFIRMED');

      const dbBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(dbBooking?.status).toBe('CONFIRMED');
    });
  });

  describe('Chat Flow', () => {
    it('should create a new chat between tenant and owner', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          recipientId: ownerUser.id,
          initialMessage: 'Hello, I have a question about my booking.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.chat).toHaveProperty('id');
      expect(res.body.data.initialMessage.content).toBe('Hello, I have a question about my booking.');
      chatId = res.body.data.chat.id;
    });

    it('should allow owner to send a reply message', async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Hi there! How can I help you?',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.content).toBe('Hi there! How can I help you?');
      expect(res.body.data.senderId).toBe(ownerUser.id);
    });

    it('should retrieve chat history', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.messages[0].content).toBe('Hello, I have a question about my booking.');
      expect(res.body.data.messages[1].content).toBe('Hi there! How can I help you?');
    });
  });
});