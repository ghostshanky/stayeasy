# StayEasy API Endpoints Documentation

This document outlines all REST API endpoints for the StayEasy platform. All endpoints use JSON for request/response bodies and follow RESTful conventions.

## Authentication
- **Bearer Token**: Include `Authorization: Bearer <token>` header for authenticated requests
- **Roles**: TENANT, OWNER, ADMIN
- **Middleware**: `requireAuth` for authentication, `requireRole(['ROLE'])` for authorization

## Common Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "pagination": {} // For paginated responses
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional info
  }
}
```

---

# Owner Endpoints

## Create Property
**POST** `/api/owner/properties`

**Auth Required**: OWNER role

**Validation**:
- `name`: string, required, 3-100 chars
- `address`: string, required, 10-500 chars
- `description`: string, optional, max 1000 chars
- `price`: number, required, > 0
- `capacity`: integer, required, 1-100
- `details`: array of {amenity: string, value: string}

**Sample Request**:
```json
{
  "name": "Cozy Downtown Hostel",
  "address": "123 Main St, City, State 12345",
  "description": "A comfortable hostel in the city center",
  "price": 45.00,
  "capacity": 20,
  "details": [
    {"amenity": "WiFi", "value": "Free"},
    {"amenity": "Breakfast", "value": "Included"}
  ]
}
```

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "property_123",
    "name": "Cozy Downtown Hostel",
    "address": "123 Main St, City, State 12345",
    "description": "A comfortable hostel in the city center",
    "price": 45.00,
    "capacity": 20,
    "ownerId": "owner_456",
    "createdAt": "2024-01-01T00:00:00Z",
    "details": [
      {"id": "detail_1", "amenity": "WiFi", "value": "Free"}
    ]
  }
}
```

**Prisma Query**:
```typescript
const property = await prisma.property.create({
  data: {
    ownerId: req.currentUser.id,
    name,
    address,
    description,
    price,
    capacity,
    details: {
      create: details
    }
  },
  include: { details: true }
})
```

**Error Codes**:
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions

## Update Property
**PUT** `/api/owner/properties/:id`

**Auth Required**: OWNER role (must own property)

**Validation**: Same as create, all fields optional

**Sample Request**:
```json
{
  "price": 50.00,
  "description": "Updated description"
}
```

**Sample Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "property_123",
    "name": "Cozy Downtown Hostel",
    "price": 50.00,
    "description": "Updated description"
  }
}
```

**Prisma Query**:
```typescript
const property = await prisma.property.update({
  where: { id, ownerId: req.currentUser.id },
  data: updates,
  include: { details: true }
})
```

**Error Codes**:
- `400`: Validation error
- `401`: Unauthorized
- `403`: Not property owner
- `404`: Property not found

## Delete Property
**DELETE** `/api/owner/properties/:id`

**Auth Required**: OWNER role (must own property)

**Sample Response** (200):
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

**Prisma Query**:
```typescript
await prisma.property.delete({
  where: { id, ownerId: req.currentUser.id }
})
```

**Error Codes**:
- `401`: Unauthorized
- `403`: Not property owner
- `404`: Property not found

## Add Property Images
**POST** `/api/owner/properties/:id/images`

**Auth Required**: OWNER role (must own property)

**Content-Type**: multipart/form-data

**Validation**:
- `images`: array of files, max 10 images, each < 5MB, formats: jpg,png,jpeg

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {"filename": "image1.jpg", "url": "https://cdn.example.com/image1.jpg"}
    ]
  }
}
```

**Prisma Query**: (Assuming File model stores image URLs)
```typescript
// After uploading to cloud storage
await prisma.file.createMany({
  data: uploadedFiles.map(file => ({
    messageId: null, // Not chat related
    url: file.url,
    type: 'image',
    // Link to property somehow - may need PropertyImage model
  }))
})
```

**Error Codes**:
- `400`: Invalid file format/size
- `401`: Unauthorized
- `403`: Not property owner

## Manage Availability
**PUT** `/api/owner/properties/:id/availability`

**Auth Required**: OWNER role (must own property)

**Validation**:
- `availableDates`: array of date ranges [{start: ISO date, end: ISO date}]

**Sample Request**:
```json
{
  "availableDates": [
    {"start": "2024-07-01", "end": "2024-07-31"}
  ]
}
```

**Sample Response** (200):
```json
{
  "success": true,
  "message": "Availability updated"
}
```

**Prisma Query**: (May need Availability model - not in current schema)
```typescript
// Assuming we add an Availability model
await prisma.availability.deleteMany({
  where: { propertyId: id }
})
await prisma.availability.createMany({
  data: availableDates.map(range => ({
    propertyId: id,
    startDate: range.start,
    endDate: range.end
  }))
})
```

## View Bookings
**GET** `/api/owner/bookings`

**Auth Required**: OWNER role

**Query Params**:
- `status`: PENDING|CONFIRMED|CANCELLED|COMPLETED
- `page`: integer, default 1
- `limit`: integer, default 10

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_123",
      "user": {"name": "John Doe", "email": "john@example.com"},
      "property": {"name": "Cozy Hostel"},
      "checkIn": "2024-07-01",
      "checkOut": "2024-07-05",
      "status": "CONFIRMED",
      "totalAmount": 200.00
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

**Prisma Query**:
```typescript
const bookings = await prisma.booking.findMany({
  where: {
    property: { ownerId: req.currentUser.id },
    status: statusFilter
  },
  include: {
    user: { select: { name: true, email: true } },
    property: { select: { name: true } },
    payments: true
  },
  skip: (page - 1) * limit,
  take: limit
})
```

## Cancel Booking
**PUT** `/api/owner/bookings/:id/cancel`

**Auth Required**: OWNER role (must own property)

**Validation**:
- `reason`: string, optional, max 500 chars

**Sample Request**:
```json
{
  "reason": "Property maintenance required"
}
```

**Sample Response** (200):
```json
{
  "success": true,
  "message": "Booking cancelled"
}
```

**Prisma Query**:
```typescript
await prisma.booking.update({
  where: {
    id,
    property: { ownerId: req.currentUser.id }
  },
  data: { status: 'CANCELLED' }
})
// Log audit
await prisma.auditLog.create({
  data: {
    action: 'BOOKING_CANCELLED',
    details: { bookingId: id, reason }
  }
})
```

---

# Tenant Endpoints

## Browse Properties
**GET** `/api/tenant/properties`

**Auth Required**: TENANT role

**Query Params**:
- `city`: string
- `minPrice`: number
- `maxPrice`: number
- `type`: string (hostel, pg, etc.)
- `amenities`: comma-separated string
- `page`: integer, default 1
- `limit`: integer, default 10

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "property_123",
      "name": "Cozy Downtown Hostel",
      "address": "123 Main St, City, State",
      "price": 45.00,
      "capacity": 20,
      "rating": 4.2,
      "images": ["url1.jpg", "url2.jpg"],
      "amenities": ["WiFi", "Breakfast"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

**Prisma Query**:
```typescript
const properties = await prisma.property.findMany({
  where: {
    address: { contains: city },
    price: { gte: minPrice, lte: maxPrice },
    details: {
      some: {
        amenity: { in: amenitiesArray }
      }
    }
  },
  include: {
    details: true,
    reviews: {
      select: { rating: true }
    }
  },
  skip: (page - 1) * limit,
  take: limit
})
```

## View Property Details
**GET** `/api/tenant/properties/:id`

**Auth Required**: TENANT role

**Sample Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "property_123",
    "name": "Cozy Downtown Hostel",
    "description": "Full description...",
    "price": 45.00,
    "capacity": 20,
    "details": [
      {"amenity": "WiFi", "value": "Free"}
    ],
    "reviews": [
      {
        "id": "review_1",
        "user": {"name": "Anonymous"},
        "rating": 4,
        "comment": "Great place!",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "averageRating": 4.2
  }
}
```

**Prisma Query**:
```typescript
const property = await prisma.property.findUnique({
  where: { id },
  include: {
    details: true,
    reviews: {
      include: { user: { select: { name: true } } }
    }
  }
})
```

## Book Property
**POST** `/api/tenant/bookings`

**Auth Required**: TENANT role

**Validation**:
- `propertyId`: string, required, valid UUID
- `checkIn`: ISO date string, required
- `checkOut`: ISO date string, required, > checkIn

**Sample Request**:
```json
{
  "propertyId": "property_123",
  "checkIn": "2024-07-01",
  "checkOut": "2024-07-05"
}
```

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "booking_456",
    "propertyId": "property_123",
    "checkIn": "2024-07-01",
    "checkOut": "2024-07-05",
    "status": "PENDING",
    "totalAmount": 180.00
  }
}
```

**Prisma Query**:
```typescript
const booking = await prisma.booking.create({
  data: {
    userId: req.currentUser.id,
    propertyId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut)
  }
})
```

## Cancel Booking
**PUT** `/api/tenant/bookings/:id/cancel`

**Auth Required**: TENANT role (must own booking)

**Sample Response** (200):
```json
{
  "success": true,
  "message": "Booking cancelled"
}
```

**Prisma Query**:
```typescript
await prisma.booking.update({
  where: {
    id,
    userId: req.currentUser.id,
    status: { not: 'COMPLETED' }
  },
  data: { status: 'CANCELLED' }
})
```

## Pay for Booking
**POST** `/api/tenant/payments`

**Auth Required**: TENANT role

**Validation**:
- `bookingId`: string, required
- `amount`: number, required, > 0

**Sample Request**:
```json
{
  "bookingId": "booking_456",
  "amount": 180.00
}
```

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_789",
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

**Prisma Query**:
```typescript
const payment = await prisma.payment.create({
  data: {
    bookingId,
    amount
  }
})
// Integrate with Stripe/Payment provider
```

## View Invoices
**GET** `/api/tenant/invoices`

**Auth Required**: TENANT role

**Query Params**:
- `page`: integer, default 1
- `limit`: integer, default 10

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "invoice_123",
      "paymentId": "payment_789",
      "amount": 180.00,
      "status": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00Z",
      "details": "Booking payment for Cozy Hostel"
    }
  ]
}
```

**Prisma Query**:
```typescript
const invoices = await prisma.invoice.findMany({
  where: {
    payment: {
      booking: { userId: req.currentUser.id }
    }
  },
  include: { payment: true },
  skip: (page - 1) * limit,
  take: limit
})
```

## Post Review
**POST** `/api/tenant/reviews`

**Auth Required**: TENANT role

**Validation**:
- `propertyId`: string, required
- `rating`: integer, 1-5, required
- `comment`: string, optional, max 1000 chars

**Sample Request**:
```json
{
  "propertyId": "property_123",
  "rating": 4,
  "comment": "Great location and friendly staff!"
}
```

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "review_123",
    "rating": 4,
    "comment": "Great location and friendly staff!",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Prisma Query**:
```typescript
const review = await prisma.review.create({
  data: {
    userId: req.currentUser.id,
    propertyId,
    rating,
    comment
  }
})
```

---

# Reviews Endpoints

## Get Reviews
**GET** `/api/reviews`

**Query Params**:
- `propertyId`: string
- `userId`: string
- `moderated`: boolean
- `page`: integer, default 1
- `limit`: integer, default 10

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "review_123",
      "user": {"name": "John Doe"},
      "property": {"name": "Cozy Hostel"},
      "rating": 4,
      "comment": "Great place!",
      "moderated": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Update Review
**PUT** `/api/reviews/:id`

**Auth Required**: Review author or ADMIN

**Sample Request**:
```json
{
  "rating": 5,
  "comment": "Updated review"
}
```

## Delete Review
**DELETE** `/api/reviews/:id`

**Auth Required**: Review author or ADMIN

## Moderate Review
**PUT** `/api/admin/reviews/:id/moderate`

**Auth Required**: ADMIN

**Validation**:
- `moderated`: boolean, required
- `moderationReason`: string, optional

---

# Chat Endpoints

## Start Chat
**POST** `/api/chat`

**Auth Required**: TENANT or OWNER

**Validation**:
- `recipientId`: string, required (other user ID)

**Sample Request**:
```json
{
  "recipientId": "user_456"
}
```

**Sample Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "chat_123",
    "participants": ["user_123", "user_456"]
  }
}
```

**Prisma Query**:
```typescript
const chat = await prisma.chat.create({
  data: {
    userId: req.currentUser.role === 'TENANT' ? req.currentUser.id : recipientId,
    ownerId: req.currentUser.role === 'OWNER' ? req.currentUser.id : recipientId
  }
})
```

## Send Message
**POST** `/api/chat/:chatId/messages`

**Auth Required**: Chat participant

**Validation**:
- `content`: string, required, 1-1000 chars

**Sample Request**:
```json
{
  "content": "Hello, is this property available?"
}
```

**Prisma Query**:
```typescript
const message = await prisma.message.create({
  data: {
    chatId,
    senderId: req.currentUser.id,
    content
  }
})
```

## Get Chat History
**GET** `/api/chat/:chatId/messages`

**Auth Required**: Chat participant

**Query Params**:
- `page`: integer, default 1
- `limit`: integer, default 20

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "message_123",
      "senderId": "user_123",
      "content": "Hello!",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Prisma Query**:
```typescript
const messages = await prisma.message.findMany({
  where: { chatId },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit
})
```

## Mark Messages Read
**PUT** `/api/chat/:chatId/read`

**Auth Required**: Chat participant

**Prisma Query**:
```typescript
// May need a read status model or field
await prisma.message.updateMany({
  where: {
    chatId,
    senderId: { not: req.currentUser.id }
  },
  data: { read: true } // Assuming we add a read field
})
```

---

# Payment Endpoints

## Create Payment Intent
**POST** `/api/payments/create-intent`

**Auth Required**: TENANT

**Validation**:
- `bookingId`: string, required

**Sample Response** (200):
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "payment_123"
  }
}
```

## Confirm Payment
**POST** `/api/payments/confirm`

**Auth Required**: TENANT

**Validation**:
- `paymentId`: string, required
- `paymentMethodId`: string, required

## Payment Webhook
**POST** `/api/payments/webhook`

**Auth Required**: None (webhook signature validation)

**Headers**:
- `Stripe-Signature`: webhook signature

**Sample Payload** (from Stripe):
```json
{
  "id": "evt_123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "amount": 18000,
      "currency": "usd",
      "status": "succeeded"
    }
  }
}
```

**Prisma Query**:
```typescript
await prisma.payment.update({
  where: { id: paymentId },
  data: { status: 'COMPLETED' }
})
await prisma.invoice.create({
  data: {
    paymentId,
    details: JSON.stringify(webhookData)
  }
})
```

---

# Admin Endpoints

## Get Users
**GET** `/api/admin/users`

**Auth Required**: ADMIN

**Query Params**:
- `role`: TENANT|OWNER|ADMIN
- `emailVerified`: boolean
- `page`: integer, default 1
- `limit`: integer, default 10

## Update User
**PUT** `/api/admin/users/:id`

**Auth Required**: ADMIN

**Validation**:
- `role`: TENANT|OWNER|ADMIN
- `emailVerified`: boolean

## Delete User
**DELETE** `/api/admin/users/:id`

**Auth Required**: ADMIN

## Remove Content
**DELETE** `/api/admin/content/:type/:id`

**Auth Required**: ADMIN

**Path Params**:
- `type`: property|review|message
- `id`: content ID

## Get Audit Logs
**GET** `/api/admin/audit-logs`

**Auth Required**: ADMIN

**Query Params**:
- `userId`: string
- `action`: string
- `startDate`: ISO date
- `endDate`: ISO date
- `page`: integer, default 1
- `limit`: integer, default 10

**Sample Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "userId": "user_456",
      "action": "BOOKING_CANCELLED",
      "details": {"bookingId": "booking_789"},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Prisma Query**:
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    userId: userIdFilter,
    action: actionFilter,
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
```

---

# Common Error Codes

- `400`: Bad Request - Validation failed
- `401`: Unauthorized - Missing/invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Business logic violation
- `429`: Too Many Requests - Rate limited
- `500`: Internal Server Error - Server error

# Rate Limiting

- Authentication endpoints: 5 requests/minute per IP
- General API: 100 requests/minute per user
- File uploads: 10 uploads/hour per user

# Pagination

All list endpoints support:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
