# StayEasy Authentication System

A comprehensive authentication system for the StayEasy hostel/PG listing platform built with Express.js, Prisma, and PostgreSQL.

## Features

- **User Registration & Login**: Email/password authentication with bcrypt hashing
- **Email Verification**: Token-based email verification system
- **Role Management**: Support for TENANT, OWNER, and ADMIN roles
- **Session Management**: Database-persisted sessions with JWT tokens
- **Middleware**: Authentication and role-based access control middleware
- **JWT Tokens**: Access and refresh token implementation
- **Prisma ORM**: Type-safe database operations

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Testing**: Jest with Supertest

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**:
   - Create a PostgreSQL database named `stayeasy`
   - Update `DATABASE_URL` in `.env` with your database credentials

3. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Seed the database** (optional):
   ```bash
   npm run db:seed
   ```

5. **Start the server**:
   ```bash
   npm run server
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stayeasy?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
PORT=3001
```

## API Endpoints

### Authentication Routes

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify-email/:token` - Verify email address
- `GET /api/auth/me` - Get current user info

### Request/Response Examples

#### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "TENANT"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "TENANT",
    "emailVerified": false
  }
}
```

#### Protected Route Access
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Middleware Usage

### Authentication Middleware
```typescript
import { requireAuth } from './middleware.js'

app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ user: req.currentUser })
})
```

### Role-Based Access Control
```typescript
import { requireRole } from './middleware.js'

app.get('/api/admin', requireRole(['ADMIN']), (req, res) => {
  res.json({ message: 'Admin access granted' })
})
```

## Database Schema

The system uses the following key tables:
- `users`: User accounts with roles and email verification
- `sessions`: Active user sessions
- Additional tables for properties, bookings, etc.

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- User registration and login flows
- Authentication middleware
- Role-based access control
- Email verification
- Session management

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Short-lived access tokens with refresh tokens
- **Session Management**: Database-tracked sessions
- **Role-Based Access**: Granular permission control
- **Email Verification**: Prevents unauthorized account access
- **Input Validation**: Type-safe API with validation

## Development

- **TypeScript**: Full type safety throughout the application
- **Prisma Client**: Type-safe database queries
- **ES Modules**: Modern JavaScript module system
- **Jest Testing**: Comprehensive test coverage

## Production Deployment

1. Set strong JWT secrets in environment variables
2. Use HTTPS in production
3. Configure proper CORS settings
4. Set up database connection pooling
5. Implement rate limiting
6. Add request logging and monitoring
