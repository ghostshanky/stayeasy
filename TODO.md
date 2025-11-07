# Dashboard Design and Implementation Plan

## Overview
Design and implement proper Owner, Admin, and Tenant dashboards according to their roles.

## Tasks

### 1. Update Types and Navigation
- [ ] Update `types.ts` to include 'adminDashboard' in Page type
- [ ] Update `App.tsx` to add admin dashboard route with authentication

### 2. Create Admin Dashboard Components
- [ ] Create `components/admin/AdminSideNavBar.tsx` with admin-specific navigation
- [ ] Create `components/admin/AdminStatCard.tsx` for admin statistics display
- [ ] Create `pages/AdminDashboard.tsx` with user management, system stats, audit logs, and content moderation features

### 3. Enhance API Functions
- [ ] Add admin-specific API functions in `api.ts` for stats, user management, audit logs
- [ ] Ensure proper role-based access in API calls

### 4. Review and Improve Existing Dashboards
- [ ] Review `pages/OwnerDashboard.tsx` for completeness and role-specific features
- [ ] Review `pages/TenantDashboard.tsx` for completeness and role-specific features
- [ ] Ensure proper navigation and feature access based on roles

### 5. Testing and Validation
- [ ] Test all three dashboards for proper functionality
- [ ] Verify role-based access and navigation
- [ ] Ensure responsive design across all dashboards

## Features by Role

### Owner Dashboard
- Property listings management
- Booking overview
- Payment verification
- Revenue statistics
- Message management

### Admin Dashboard
- User management (view, edit, deactivate users)
- System statistics (users, properties, bookings, payments)
- Audit log viewing
- Content moderation (remove inappropriate reviews/properties/messages)
- Platform analytics

### Tenant Dashboard
- Booking management
- Payment history
- Upcoming stays
- Review management
- Message center
