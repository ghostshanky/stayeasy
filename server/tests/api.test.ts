import request from 'supertest';
import app from '../server';
import { AuthService } from '../auth';

describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
        it('should create a new user with valid data', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: `test${Date.now()}@example.com`,
                    password: 'Test123!@#',
                    name: 'Test User',
                    role: 'TENANT'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user).toHaveProperty('email');
            expect(response.body.data.user).toHaveProperty('name', 'Test User');
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com'
                    // Missing password and name
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code', 'MISSING_FIELDS');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            // First create a user
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: `login${Date.now()}@example.com`,
                    password: 'Test123!@#',
                    name: 'Login Test',
                    role: 'TENANT'
                });

            const email = signupResponse.body.data.user.email;

            // Then login
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email,
                    password: 'Test123!@#'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            // Create and login user
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: `me${Date.now()}@example.com`,
                    password: 'Test123!@#',
                    name: 'Me Test',
                    role: 'TENANT'
                });

            const token = signupResponse.body.data.accessToken;

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.user).toHaveProperty('email');
            expect(response.body.data.user).toHaveProperty('name', 'Me Test');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toHaveProperty('code', 'MISSING_TOKEN');
        });
    });
});

describe('Properties Endpoints', () => {
    describe('GET /api/properties', () => {
        it('should return properties list with pagination', async () => {
            const response = await request(app)
                .get('/api/properties');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('currentPage');
            expect(response.body.pagination).toHaveProperty('totalPages');
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should support pagination parameters', async () => {
            const response = await request(app)
                .get('/api/properties?page=1&limit=5');

            expect(response.status).toBe(200);
            expect(response.body.pagination.limit).toBe(5);
            expect(response.body.pagination.currentPage).toBe(1);
        });
    });
});

describe('Health Check', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
        });
    });
});
