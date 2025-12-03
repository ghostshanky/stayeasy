# Unit Tests - StayEasy API

## Overview

Comprehensive unit tests for critical API endpoints using Jest and Supertest.

## Test Coverage

### Authentication Endpoints ✅
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user info

### Properties Endpoints ✅
- `GET /api/properties` - List properties with pagination

### Health Check ✅
- `GET /api/health` - Server health status

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Each test suite validates:
1. ✅ Successful responses (200/201)
2. ✅ Error handling (400/401/404)
3. ✅ Response format consistency
4. ✅ Required fields presence
5. ✅ Proper HTTP status codes

## Example Test

```typescript
it('should create a new user with valid data', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
      role: 'TENANT'
    });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body.data).toHaveProperty('accessToken');
});
```

## Adding New Tests

1. Create test file in `server/tests/`
2. Import required modules
3. Write describe blocks for endpoints
4. Add test cases for success/error scenarios
5. Run tests to verify

## Best Practices

- ✅ Test both success and error cases
- ✅ Use unique data for each test (timestamps)
- ✅ Clean up test data after tests
- ✅ Mock external services
- ✅ Test edge cases

## Status

**Current Coverage:** ~30% (critical endpoints)  
**Target Coverage:** 80%  
**Next Steps:** Add tests for bookings, payments, reviews

## Notes

- Tests use in-memory database for speed
- Each test is isolated and independent
- Tests validate response format consistency
- All tests follow AAA pattern (Arrange, Act, Assert)
