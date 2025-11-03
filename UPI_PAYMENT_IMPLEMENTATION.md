# UPI Payment Verification System Implementation

This document outlines the complete manual UPI payment verification system for StayEasy, including payment creation, tenant confirmation, owner verification, and invoice generation.

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Tenant    │    │   Backend   │    │   Owner     │
│             │    │   API       │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 1. Create Payment │                  │
       │◄──────────────────┤                  │
       │                  │                  │
       │ 2. Confirm Paid   │                  │
       │──────────────────►│                  │
       │                  │                  │
       │                  │ 3. Verify/Reject │
       │                  │◄──────────────────┤
       │                  │                  │
       │                  │ 4. Generate      │
       │                  │ Invoice          │
       │                  │──────────────────►│
       │                  │                  │
       │ 5. Booking       │                  │
       │ Confirmed        │                  │
       │◄──────────────────┤                  │
       └──────────────────┘                  └──────────────────┘
```

## Database Schema Updates

### Payment Model
```prisma
enum PaymentStatus {
  AWAITING_PAYMENT
  AWAITING_OWNER_VERIFICATION
  VERIFIED
  REJECTED
  CANCELLED
}

model Payment {
  id             String      @id @default(uuid())
  bookingId      String?
  booking        Booking?    @relation(fields:[bookingId], references:[id])
  userId         String
  user           User        @relation(fields:[userId], references:[id])
  ownerId        String
  owner          User        @relation("OwnerPayments", fields:[ownerId], references:[id])
  amount         Int         // Amount in paisa (100 = ₹1)
  currency       String      @default("INR")
  upiUri         String      // Generated UPI payment URI
  upiReference   String?     // Optional UPI transaction ID
  status         PaymentStatus @default(AWAITING_PAYMENT)
  verifiedBy     String?     // Owner who verified
  verifiedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  invoice        Invoice?
}
```

### Invoice Model
```prisma
model Invoice {
  id           String   @id @default(uuid())
  invoiceNo    String   @unique
  bookingId    String?
  booking      Booking? @relation(fields:[bookingId], references:[id])
  paymentId    String?
  payment      Payment? @relation(fields:[paymentId], references:[id])
  userId       String
  user         User     @relation(fields:[userId], references:[id])
  ownerId      String
  owner        User     @relation("OwnerInvoices", fields:[ownerId], references:[id])
  lineItems    Json     // Array of line items with description and amount
  amount       Int      // Total amount in paisa
  status       String   // Invoice status
  pdfFileId    String?  // Reference to generated PDF
  createdAt    DateTime @default(now())
}
```

## Payment Flow Implementation

### 1. Payment Creation (`POST /api/payments/create`)

**Request:**
```json
{
  "bookingId": "booking-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "bookingId": "booking-uuid",
    "amount": 200000,
    "currency": "INR",
    "upiUri": "upi://pay?pa=owner@upi&pn=OwnerName&am=2000&tn=Booking123&cu=INR",
    "qrCode": "upi://pay?pa=owner@upi&pn=OwnerName&am=2000&tn=Booking123&cu=INR",
    "status": "AWAITING_PAYMENT",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

**Implementation:**
- Validates booking exists and belongs to authenticated user
- Checks no existing payment for booking
- Calculates amount based on booking duration and property price
- Generates UPI URI with owner details
- Creates Payment record with `AWAITING_PAYMENT` status

### 2. Payment Confirmation (`POST /api/payments/confirm`)

**Request:**
```json
{
  "paymentId": "payment-uuid",
  "upiReference": "UPI123456789"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "AWAITING_OWNER_VERIFICATION",
    "upiReference": "UPI123456789",
    "updatedAt": "2024-01-01T10:05:00Z"
  },
  "message": "Payment confirmation submitted. Waiting for owner verification."
}
```

**Implementation:**
- Validates payment exists and belongs to authenticated user
- Updates status to `AWAITING_OWNER_VERIFICATION`
- Stores optional UPI reference

### 3. Payment Verification (`POST /api/payments/verify`)

**Request:**
```json
{
  "paymentId": "payment-uuid",
  "action": "verify",  // or "reject"
  "reason": "Optional reason for rejection"
}
```

**Response (Verify):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "VERIFIED",
    "verifiedBy": "owner-uuid",
    "verifiedAt": "2024-01-01T10:10:00Z",
    "invoice": {
      "id": "invoice-uuid",
      "invoiceNo": "INV-1704102600000-ABC12345",
      "amount": 200000,
      "status": "PAID"
    },
    "booking": {
      "id": "booking-uuid",
      "status": "CONFIRMED"
    }
  },
  "message": "Payment verified and invoice generated"
}
```

**Response (Reject):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "REJECTED",
    "verifiedBy": "owner-uuid",
    "verifiedAt": "2024-01-01T10:10:00Z",
    "invoice": null,
    "booking": null
  },
  "message": "Payment rejected"
}
```

**Implementation:**
- Validates owner has permission to verify payment
- Updates payment status and verification details
- If verified: generates invoice, updates booking to CONFIRMED
- If rejected: sets status to REJECTED

### 4. Get Pending Payments (`GET /api/payments/pending`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "bookingId": "booking-uuid",
      "amount": 200000,
      "currency": "INR",
      "upiReference": "UPI123456789",
      "status": "AWAITING_OWNER_VERIFICATION",
      "createdAt": "2024-01-01T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "booking": {
        "id": "booking-uuid",
        "checkIn": "2024-02-01T00:00:00Z",
        "checkOut": "2024-02-03T00:00:00Z",
        "property": {
          "name": "Cozy Hostel Downtown",
          "address": "123 Main St, City, State"
        }
      }
    }
  ]
}
```

## UPI URI Generation

### UPI URI Format
```
upi://pay?pa={payeeUPI}&pn={payeeName}&am={amount}&tn={transactionNote}&cu={currency}
```

**Example:**
```
upi://pay?pa=merchant@upi&pn=StayEasy%20Owner&am=2000.00&tn=Booking%20BK123&cu=INR
```

### Implementation
```typescript
static generateUPIPaymentURI(params: {
  payeeUPI: string
  payeeName: string
  amount: number
  transactionNote: string
}): string {
  const uri = new URL('upi://pay')
  uri.searchParams.set('pa', payeeUPI)
  uri.searchParams.set('pn', payeeName)
  uri.searchParams.set('am', amount.toString())
  uri.searchParams.set('tn', transactionNote)
  uri.searchParams.set('cu', 'INR')
  return uri.toString()
}
```

## Invoice Generation

### Invoice Structure
```json
{
  "invoiceNo": "INV-1704102600000-ABC12345",
  "bookingId": "booking-uuid",
  "paymentId": "payment-uuid",
  "userId": "user-uuid",
  "ownerId": "owner-uuid",
  "lineItems": [
    {
      "description": "Accommodation at Cozy Hostel Downtown",
      "amount": 200000
    }
  ],
  "amount": 200000,
  "status": "PAID",
  "createdAt": "2024-01-01T10:10:00Z"
}
```

### PDF Generation
- Generates HTML template with booking and payment details
- Saves as HTML file (production: convert to PDF using puppeteer)
- Stores file reference in `pdfFileId` field

## Frontend Integration

### QR Code Display
```html
<div class="payment-section">
  <h3>Complete Payment</h3>
  <div class="amount">₹{{ amount / 100 }}</div>

  <div class="qr-code-container">
    <canvas id="upi-qr-code"></canvas>
    <p>Scan with any UPI app</p>
  </div>

  <div class="upi-details">
    <p><strong>UPI ID:</strong> {{ upiUri.split('pa=')[1].split('&')[0] }}</p>
    <p><strong>Amount:</strong> ₹{{ amount / 100 }}</p>
    <button @click="confirmPayment">I have paid</button>
  </div>

  <div class="status-message">
    {{ paymentStatus }}
  </div>
</div>
```

### JavaScript Integration
```javascript
async function confirmPayment() {
  // Open UPI app
  window.open(upiUri, '_blank')

  // Show confirmation after delay
  setTimeout(async () => {
    const upiRef = prompt('Enter UPI transaction ID (optional):')
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId,
          upiReference: upiRef
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('Payment submitted for verification')
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error)
    }
  }, 2000)
}
```

## Testing

### Unit Tests
- Payment creation validation
- UPI URI generation
- Status transitions
- Invoice generation
- Error handling

### Integration Tests
- Complete payment flow (create → confirm → verify)
- Rejection flow
- Concurrent payment attempts
- Invalid booking/payment IDs

### Test Script
```javascript
// test-payment-flow.js
const { simulatePaymentFlow, simulateRejectionFlow } = require('./test-payment-flow')

// Run complete flow simulation
simulatePaymentFlow()
  .then(() => simulateRejectionFlow())
  .then(() => console.log('All tests passed'))
  .catch(console.error)
```

## Security Considerations

### Authentication
- All endpoints require valid JWT authentication
- Owner-only endpoints check user role
- Payment ownership validation

### Validation
- Booking existence and ownership checks
- Payment status validation for state transitions
- Amount calculation verification

### Audit Trail
- All payment actions logged with timestamps
- Verification details stored (who, when)
- Status change history

## Production Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/stayeasy
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Database Migrations
```bash
npx prisma migrate dev --name add-payment-system
npx prisma generate
```

### API Documentation
- OpenAPI/Swagger documentation for all endpoints
- Request/response examples
- Error code reference

## Error Handling

### Common Error Codes
- `BOOKING_NOT_FOUND`: Booking doesn't exist or doesn't belong to user
- `PAYMENT_EXISTS`: Payment already created for booking
- `PAYMENT_NOT_FOUND`: Payment not found or not eligible for action
- `INVALID_ACTION`: Verification action not 'verify' or 'reject'
- `UNAUTHORIZED`: User not authorized for action

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

This implementation provides a complete manual UPI payment verification system with proper validation, security, and testing coverage.
