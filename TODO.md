# StayEasy Production-Ready Implementation Plan

## Sprint 1: Critical Fixes & Branding ✅
- [x] Fix branding: Search and replace all "Stays.io" → "StayEasy", centralize in brand.ts
- [x] Fix Avatar Menu: Separate menu open from logout action
- [x] Remove Prisma: Delete prisma/ folder, remove @prisma/client from package.json
- [x] Update auth.ts to use Supabase instead of Prisma
- [x] Update server.ts and other server files to use Supabase only
- [x] Add missing database columns: bio, mobile, role, image_id, updated_at to users table
- [x] Replace hardcoded explore data with Supabase fetches
- [x] Implement persistent messaging via Supabase Realtime

## Sprint 2: Core Features - Explore & Messaging
- [ ] Explore Page: Add filters, pagination, real data from Supabase
- [ ] Messaging System: Store messages in database, show in both sender/receiver dashboards
- [ ] Profile Page: Implement ImageKit upload, rename to <user_id>.png, store image_id
- [ ] Owner Dashboard: Add/edit listings with ImageKit multi-image upload
- [ ] Owner Dashboard: View bookings calendar, payments list, messages
- [ ] Tenant Dashboard: View bookings, chat with owners, mark payments paid

## Sprint 3: Payments & Admin
- [ ] Payments: Implement UPI QR generator and verification flow
- [ ] Admin Dashboard: User/property moderation, analytics
- [ ] Global Features: Add react-hot-toast, dark mode toggle, responsive design
- [ ] Role-based routing: Protect routes based on user roles

## Sprint 4: Quality & Testing
- [ ] Code Quality: ESLint/Prettier setup, remove unused deps, optimize queries
- [ ] Testing: Add Jest tests for auth, properties, bookings, payments
- [ ] Build & Deployment: Ensure npm run build passes, add .env.example
- [ ] Documentation: Update README.md, create CHANGELOG.md

## Sprint 5: Final Polish & Deployment
- [ ] Error handling: Add global error boundaries, loading states
- [ ] Performance: Lazy load pages, optimize images, Supabase query optimization
- [ ] Security: Validate inputs, protect API endpoints, sanitize data
- [ ] Deployment: Test on Vercel/Railway/Render, verify all features work

## Current Status
- ✅ Sprint 1 Complete: Server running with Supabase, branding consistent, avatar menu fixed
- 🚀 Ready for Sprint 2: Core feature implementation
