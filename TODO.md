# StayEasy Production-Ready App TODO

## Current Task: Fix getOwnerPayments Endpoint Implementation
- [x] Fix route conflict: `/api/payments/pending` should call `getPendingPayments` instead of `getOwnerPayments`
- [x] Add `getPendingPayments` method to PaymentController
- [x] Regenerate Prisma client to fix type issues
- [x] Enhance `getOwnerPayments` method to include booking and user details
- [x] Test the endpoints to ensure they work correctly

## Next Steps for Production-Ready App
- [ ] Fix all TypeScript, JSX, and backend errors
- [ ] Ensure all navigation links and buttons perform correct actions (no dead redirects)
- [ ] Implement complete payment flow:
  - Owner sets payable amount and generates UPI URI
  - Tenant clicks "Payment Done" after manual payment
  - Owner verifies and marks payment as "Paid" from dashboard
- [ ] Verify database operations for tenants, owners, rooms, and payments (all CRUD operations)
- [ ] Fix API routes, imports, and dependencies for Postgres (via Supabase)
- [ ] Ensure JWT auth works correctly with .env (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT=3001)
- [ ] Make UI modern, responsive, and professional-looking
- [ ] Remove all console errors, warnings, unused imports, and redundant code
- [ ] Test-run the project until it starts successfully without build errors or broken routes
