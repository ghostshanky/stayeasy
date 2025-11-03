
# Acceptance Test Plan

This document outlines the test cases for the manual QA pass to ensure the product is production-ready.

## 1. Sign Up / Login Flows

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | Tenant Sign Up | 1. Navigate to the signup page. <br> 2. Fill in the required details for a new tenant. <br> 3. Submit the form. | 1. User is redirected to the login page or tenant dashboard. <br> 2. A new user record is created in the database with the `TENANT` role. | `SELECT * FROM users WHERE email = 'tenant@example.com';` should return a new user with `role = 'TENANT'`. |
| **AUTH-002** | Owner Sign Up | 1. Navigate to the signup page. <br> 2. Select the "Owner" user type. <br> 3. Fill in the required details for a new owner. <br> 4. Submit the form. | 1. User is redirected to the login page or owner dashboard. <br> 2. A new user record is created in the database with the `OWNER` role. | `SELECT * FROM users WHERE email = 'owner@example.com';` should return a new user with `role = 'OWNER'`. |
| **AUTH-003** | Admin Sign Up | 1. Manually create an admin user in the database. | 1. A new user record is created in the database with the `ADMIN` role. | `INSERT INTO users (id, email, password, name, role) VALUES ('admin-id', 'admin@example.com', 'hashed_password', 'Admin User', 'ADMIN');` |
| **AUTH-004** | Login (Tenant, Owner, Admin) | 1. Navigate to the login page. <br> 2. Enter credentials for each user type. <br> 3. Submit the form. | 1. User is redirected to the appropriate dashboard. <br> 2. A session is created for the user. | `SELECT * FROM sessions WHERE userId = 'user-id';` should return an active session. |
| **AUTH-005** | Invalid Login | 1. Navigate to the login page. <br> 2. Enter invalid credentials. <br> 3. Submit the form. | 1. An error message is displayed. <br> 2. User is not logged in. | No new session should be created in the `sessions` table. |

## 2. Property Management (Owner)

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **PROP-001** | Create Property | 1. Log in as an owner. <br> 2. Navigate to "Create Property". <br> 3. Fill in property details (name, address, price, etc.). <br> 4. Upload property images. <br> 5. Submit the form. | 1. Property is created and appears in the owner's listings. <br> 2. Images are uploaded and associated with the property. <br> 3. Property is visible to tenants. | `SELECT * FROM properties WHERE name = 'My New Property';` <br> `SELECT * FROM files WHERE propertyId = 'property-id';` |

## 3. Booking and Payment Flow (Tenant)

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **BOOK-001** | Book Property | 1. Log in as a tenant. <br> 2. Find a property and click "Book Now". <br> 3. Select check-in and check-out dates. <br> 4. Confirm the booking. | 1. A booking record is created with `PENDING` status. <br> 2. User is redirected to the payment page. | `SELECT * FROM bookings WHERE userId = 'tenant-id' AND propertyId = 'property-id';` |
| **PAY-001** | Create Payment | 1. On the payment page, a QR code and UPI details are displayed. <br> 2. Click the "I have paid" button. | 1. A payment record is created with `AWAITING_OWNER_VERIFICATION` status. | `SELECT * FROM payments WHERE bookingId = 'booking-id';` should show `status = 'AWAITING_OWNER_VERIFICATION'`. |

## 4. Payment Verification (Owner)

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **PAY-002** | Verify Payment | 1. Log in as an owner. <br> 2. Go to the dashboard and view pending payments. <br> 3. Find the payment from PAY-001 and click "Verify". | 1. Payment status is updated to `VERIFIED`. <br> 2. Booking status is updated to `CONFIRMED`. <br> 3. An invoice is generated and available for download. | `SELECT * FROM payments WHERE id = 'payment-id';` should show `status = 'VERIFIED'`. <br> `SELECT * FROM bookings WHERE id = 'booking-id';` should show `status = 'CONFIRMED'`. <br> `SELECT * FROM invoices WHERE paymentId = 'payment-id';` |

## 5. Chat

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **CHAT-001** | Send/Receive Messages | 1. Tenant initiates a chat with an owner. <br> 2. Tenant sends a message. <br> 3. Owner logs in and views the message. <br> 4. Owner replies to the message. | 1. Messages are persisted in the database. <br> 2. Unread message count is updated correctly for both users. <br> 3. Messages are displayed in the chat window. | `SELECT * FROM messages WHERE chatId = 'chat-id' ORDER BY createdAt DESC;` |
| **CHAT-002** | Pagination | 1. In a chat with many messages, scroll to the top of the chat window. | 1. Older messages are loaded and displayed. | Check the network requests to see if previous messages are being fetched. |

## 6. Reviews

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **REV-001** | Post Review | 1. A tenant who has completed a booking navigates to the property page. <br> 2. The tenant leaves a rating and a comment. | 1. The review is saved in the database. <br> 2. The review is displayed on the property page. | `SELECT * FROM reviews WHERE userId = 'tenant-id' AND propertyId = 'property-id';` |
| **REV-002** | Moderate Review | 1. Log in as an owner or admin. <br> 2. Navigate to the reviews section. <br> 3. Delete an inappropriate review. | 1. The review is removed from the database. | `SELECT * FROM reviews WHERE id = 'review-id';` should return no results. |

## 7. Security

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Role-Based Access | 1. Attempt to access owner-specific pages (e.g., create property) as a tenant. <br> 2. Attempt to access admin-only APIs with an owner or tenant token. | 1. Access is denied. An appropriate error message is shown. | API calls should return 403 Forbidden or similar error. |
| **SEC-002** | Invalid/Expired Token | 1. Make an API request with an invalid or expired JWT token. | 1. The request is rejected with a 401 Unauthorized error. | API calls should return 401 Unauthorized. |
| **SEC-003** | Rate Limiting | 1. Send a large number of requests to an API endpoint in a short time. | 1. After a certain threshold, requests are rejected with a 429 Too Many Requests error. | Check API responses for 429 status code. |
| **SEC-004** | Input Validation | 1. Attempt to submit forms with invalid data (e.g., invalid email format, missing required fields, malicious scripts). | 1. The server rejects the request with a 400 Bad Request error. <br> 2. No invalid data is saved to the database. | Check API responses for 400 status code and verify database integrity. |

## 8. Backup and Restore

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **DB-001** | Database Backup and Restore | 1. Take a dump of the production database. <br> 2. Create a new test database instance. <br> 3. Restore the dump to the test instance. | 1. The restore process completes successfully. <br> 2. The data in the test instance is identical to the production data at the time of the backup. | `pg_dump -U user -d production_db > backup.sql` <br> `psql -U user -d test_db < backup.sql` <br> Run spot checks on the restored data. |

## 9. Failover and Idempotency

| Test Case ID | Description | Steps | Expected Results | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **FAIL-001** | Payment Idempotency | 1. Identify the API endpoint for payment verification. <br> 2. Using an API client, send two identical requests to verify the same payment in quick succession. | 1. The first request succeeds and updates the payment status. <br> 2. The second request is handled gracefully, either by returning the current (already verified) status or by ignoring the duplicate request. <br> 3. The payment is only verified once. | Check the `payments` and `audit_logs` tables to ensure the verification action was only logged and performed once. |
