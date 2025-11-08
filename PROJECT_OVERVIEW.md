# StayEasy Project Overview

## Project Description
StayEasy is a comprehensive platform for booking budget-friendly hostels and PGs (Paying Guest accommodations) for students and professionals. The platform connects property owners with tenants, featuring manual UPI payment verification, real-time chat, reviews, and administrative controls.

## Architecture Overview

### Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with session management
- **Real-time**: Socket.IO for chat functionality
- **Deployment**: Vercel (serverless)
- **Testing**: Jest with TypeScript
- **Additional**: QR code generation, PDF generation, file uploads

### Database Schema
The project uses Prisma with PostgreSQL, featuring the following main models:
- **User**: TENANT, OWNER, ADMIN roles
- **Property**: Listings with details, amenities, images
- **Booking**: Reservations with status tracking
- **Payment**: UPI-based payments with verification workflow
- **Invoice**: Generated receipts for completed payments
- **Chat/Message**: Real-time messaging between tenants and owners
- **Review**: Property ratings and feedback
- **File**: Media uploads (images, documents)
- **AuditLog**: System activity tracking
- **Session/RefreshToken**: Authentication management

## Core Features

### 1. User Management
- **Authentication**: Login/signup with role-based access (Tenant, Owner, Admin)
- **Profiles**: User information, avatars, verification status
- **Sessions**: Secure token-based authentication with refresh tokens

### 2. Property Management (Owners)
- **Listing Creation**: Add properties with details, amenities, pricing
- **Image Uploads**: Multiple property photos with file management
- **Availability Management**: Date-based availability tracking
- **Dashboard**: Owner statistics, listing management, payment verification

### 3. Booking System (Tenants)
- **Search & Browse**: Filter properties by location, price, type
- **Booking Flow**: Select dates, confirm booking
- **Payment Integration**: UPI QR code generation and manual verification

### 4. Payment System
- **UPI Integration**: Generate payment URIs and QR codes
- **Manual Verification**: Owner approval workflow for payments
- **Invoice Generation**: PDF receipts for completed transactions
- **Status Tracking**: Payment states (Pending, Verified, Rejected, etc.)

### 5. Communication
- **Real-time Chat**: Socket.IO-based messaging between tenants and owners
- **Message Persistence**: Database storage with file attachments
- **Read Receipts**: Message status tracking
- **Chat History**: Paginated message loading

### 6. Reviews & Ratings
- **Property Reviews**: Tenant feedback with ratings
- **Moderation**: Admin content management
- **Display**: Review aggregation on property pages

### 7. Administrative Controls
- **User Management**: Role assignment, user moderation
- **Audit Logging**: System activity monitoring
- **Content Moderation**: Review and listing management
- **Analytics**: Platform statistics and metrics

## File Structure

### Frontend (React/TypeScript)
```
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── owner/          # Owner dashboard components
│   └── ...             # General components
├── pages/              # Page components
│   ├── AuthPage.tsx    # Login/signup
│   ├── LandingPage.tsx # Homepage
│   ├── OwnerDashboard.tsx
│   ├── TenantDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── api/                # API client functions
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component
└── index.tsx           # Entry point
```

### Backend (Node.js/Express)
```
├── server/
│   ├── controllers/    # Route handlers
│   │   ├── auth.ts
│   │   ├── paymentsController.ts
│   │   ├── bookingsController.ts
│   │   └── ...
│   ├── routes/         # API route definitions
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utility functions
│   ├── validations/    # Input validation
│   ├── chat.ts         # Socket.IO chat service
│   ├── server.ts       # Main server file
│   └── ...
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── seed.ts         # Database seeding
│   └── migrations/     # DB migrations
└── tests/              # Test files
```

## Key Workflows

### Booking & Payment Flow
1. **Tenant** searches and selects property
2. **Tenant** chooses dates and initiates booking
3. **System** creates booking (PENDING status)
4. **System** generates UPI payment details and QR code
5. **Tenant** makes UPI payment and confirms in app
6. **System** updates payment to AWAITING_OWNER_VERIFICATION
7. **Owner** reviews payment and verifies/rejects
8. **System** generates invoice and updates booking to CONFIRMED
9. **Tenant** receives confirmation and invoice

### Chat System
1. **Tenant/Owner** initiates chat for specific property
2. **System** creates chat room and persists messages
3. **Real-time** message delivery via Socket.IO
4. **File attachments** supported in messages
5. **Read receipts** and typing indicators
6. **Message history** with pagination

### Admin Moderation
1. **Admin** monitors user activity via audit logs
2. **Admin** manages user roles and permissions
3. **Admin** moderates inappropriate content (reviews, listings)
4. **Admin** views platform analytics and statistics

## Current Implementation Status

### ✅ Completed Features
- User authentication and role management
- Property listing and management
- Basic booking system
- UPI payment generation and QR codes
- Payment verification workflow
- Invoice generation (PDF)
- Real-time chat system
- Review system
- Admin dashboard with user management
- File upload system
- Audit logging
- Responsive UI with dark mode

### 🔄 Partially Implemented
- Payment verification UI (basic structure exists)
- Chat UI components (functional but may need polish)
- Admin moderation tools (basic framework)

### ❌ Missing/Incomplete
- Full payment verification integration
- Complete chat UI/UX
- Advanced search and filtering
- Notification system
- Email verification
- Advanced admin analytics
- Mobile app (if planned)

## Testing Coverage
- **Unit Tests**: Individual function/component testing
- **Integration Tests**: API endpoint testing
- **Acceptance Tests**: End-to-end user flow validation
- **Test Files**: Located in `/tests/` directory
- **Coverage**: Server-side code with Jest

## Deployment & DevOps
- **Development**: Local setup with npm scripts
- **Database**: Supabase or Neon PostgreSQL
- **Deployment**: Vercel for serverless functions
- **Environment**: Separate configs for dev/prod
- **CI/CD**: GitHub Actions workflow

## Security Measures
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- Audit logging for sensitive operations
- Secure file uploads
- CORS configuration

## Performance Considerations
- Database indexing on frequently queried fields
- Pagination for large datasets
- Image optimization and CDN usage
- Caching strategies (Redis for sessions)
- Serverless function optimization

## Future Enhancements
- Mobile application development
- Advanced search with maps integration
- Automated payment verification (UPI callbacks)
- Push notifications
- Multi-language support
- Advanced analytics dashboard
- Integration with external services (maps, payment gateways)

## Development Setup
1. **Prerequisites**: Node.js, PostgreSQL, Git
2. **Installation**: `npm install` in root and `/server`
3. **Database**: Set up PostgreSQL, run Prisma migrations
4. **Environment**: Configure `.env` files
5. **Development**: `npm run dev` (client), `npm run server` (server)
6. **Testing**: `npm test` for Jest tests

## API Endpoints Summary
- **Auth**: `/api/auth/login`, `/api/auth/signup`, `/api/auth/refresh`
- **Properties**: `/api/properties` (CRUD operations)
- **Bookings**: `/api/bookings` (create, list, update)
- **Payments**: `/api/payments/create`, `/api/payments/confirm`, `/api/payments/verify`
- **Chat**: `/api/chats`, `/api/messages`
- **Reviews**: `/api/reviews`
- **Admin**: `/api/admin/users`, `/api/admin/stats`, `/api/admin/audit`

This overview provides a comprehensive view of the StayEasy platform's current state, architecture, and implementation details.
