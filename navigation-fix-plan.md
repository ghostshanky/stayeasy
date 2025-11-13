# Navigation Fix Plan for Dashboard/Owner and Dashboard/Tenant

## Problem Analysis

### Current Navigation Issues Identified:

1. **Side Navigation Bar Problems:**
   - **Tenant SideNavBar**: Settings button navigates to `tenantDashboard` instead of a settings page
   - **Owner SideNavBar**: Settings button navigates to `ownerDashboard` instead of settings page  
   - **Admin SideNavBar**: All navigation buttons except Dashboard point to `adminDashboard` without specific routing

2. **Missing Route Mappings:**
   - Settings pages are not properly routed in App.tsx
   - Some navigation targets don't have corresponding page components

3. **Quick Actions Issues:**
   - TenantDashboard Quick Actions buttons call `pageNavigate` but don't navigate to correct pages
   - Missing proper navigation handlers

4. **Navigation Handler Problems:**
   - Dashboard pages receive `navigate` prop but don't use it properly for internal navigation
   - Inconsistent navigation patterns across different components

## Solution Architecture

### Phase 1: Update Type Definitions and Navigation Structure

#### 1.1 Update Page Type Definition
**File:** `client/src/types/index.ts`
- Add missing page types to the `Page` type definition
- Include: `settings`, `ownerSettings`, `adminSettings`, `ownerBookings`, `ownerPayments`, `ownerMessages`

#### 1.2 Fix Navigation Handlers in SideNavBar Components

**File:** `components/SideNavBar.tsx`
- Import `useNavigate` from `react-router-dom`
- Replace `onNavigate` prop with proper React Router navigation
- Update navigation handlers to use `navigate()` function

**File:** `components/owner/OwnerSideNavBar.tsx`
- Import `useNavigate` from `react-router-dom`
- Replace `onNavigate` prop with proper React Router navigation
- Fix Settings button to navigate to `/dashboard/owner/settings`

**File:** `components/admin/AdminSideNavBar.tsx`
- Import `useNavigate` from `react-router-dom`
- Replace `onNavigate` prop with proper React Router navigation
- Fix all navigation buttons to route to specific admin pages

### Phase 2: Update Routing Configuration

#### 2.1 Update App.tsx Routing
**File:** `App.tsx`
- Add missing routes for settings pages:
  - `/dashboard/owner/settings` → `OwnerSettingsPage`
  - `/dashboard/tenant/settings` → `TenantSettingsPage` (create if needed)
  - `/admin-dashboard/settings` → `AdminSettingsPage` (create if needed)
- Add routes for owner-specific pages:
  - `/dashboard/owner/bookings` → `OwnerBookingsPage`
  - `/dashboard/owner/payments` → `OwnerPaymentsPage`
  - `/dashboard/owner/messages` → `OwnerMessagesPage`

#### 2.2 Update ProtectedRoute Configuration
- Ensure all new routes are properly protected with appropriate role requirements

### Phase 3: Update Dashboard Components

#### 3.1 Update TenantDashboard
**File:** `pages/TenantDashboard.tsx`
- Fix Quick Actions buttons to use proper navigation
- Update `getQuickActions()` function to use `useNavigate()` instead of `pageNavigate`
- Remove unused `pageNavigate` prop

#### 3.2 Update OwnerDashboard
**File:** `pages/OwnerDashboard.tsx`
- Fix navigation handlers for internal tabs
- Update to use `useNavigate()` for proper routing
- Fix Settings button in header to navigate to settings page

#### 3.3 Update AdminDashboard
**File:** `pages/AdminDashboard.tsx`
- Update navigation handlers for tab switching
- Ensure proper routing for admin-specific actions

### Phase 4: Create Missing Page Components

#### 4.1 Create Owner-Specific Pages
- **OwnerBookingsPage**: Display bookings for properties owned by the user
- **OwnerPaymentsPage**: Display payment information for owned properties
- **OwnerMessagesPage**: Display messages related to owned properties

#### 4.2 Create Settings Pages
- **OwnerSettingsPage**: Already exists, needs routing fix
- **TenantSettingsPage**: Create tenant-specific settings page
- **AdminSettingsPage**: Create admin-specific settings page

### Phase 5: Update Header Components

#### 5.1 Update OwnerHeader
**File:** `components/owner/OwnerHeader.tsx`
- Fix "Add New Listing" button to navigate to property creation page
- Update to use `useNavigate()` hook

#### 5.2 Update Header
**File:** `components/Header.tsx`
- Ensure proper navigation for dashboard links

## Implementation Steps

### Step 1: Update Type Definitions
```typescript
// In client/src/types/index.ts
export type Page = 
  | 'landing' 
  | 'searchResults' 
  | 'propertyDetails' 
  | 'confirmAndPay' 
  | 'ownerDashboard' 
  | 'tenantDashboard' 
  | 'adminDashboard' 
  | 'login' 
  | 'signup' 
  | 'paymentVerification' 
  | 'myListings' 
  | 'bookings' 
  | 'payments' 
  | 'messages'
  | 'settings'
  | 'ownerSettings'
  | 'adminSettings'
  | 'ownerBookings'
  | 'ownerPayments'
  | 'ownerMessages';
```

### Step 2: Fix SideNavBar Navigation
```typescript
// In components/SideNavBar.tsx
import { useNavigate } from 'react-router-dom';

const SideNavBar: React.FC<SideNavBarProps> = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (page: Page) => {
    switch (page) {
      case 'dashboard':
        navigate('/dashboard/tenant');
        break;
      case 'bookings':
        navigate('/bookings');
        break;
      case 'payments':
        navigate('/payments');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'settings':
        navigate('/dashboard/tenant/settings');
        break;
      default:
        navigate('/');
    }
  };
```

### Step 3: Update App.tsx Routes
```typescript
// In App.tsx
// Add these routes:
<Route path="/dashboard/owner/settings" element={
  <ProtectedRoute requiredRoles={['OWNER']}>
    <OwnerSettingsPage />
  </ProtectedRoute>
} />
<Route path="/dashboard/owner/bookings" element={
  <ProtectedRoute requiredRoles={['OWNER']}>
    <OwnerBookingsPage />
  </ProtectedRoute>
} />
<Route path="/dashboard/owner/payments" element={
  <ProtectedRoute requiredRoles={['OWNER']}>
    <OwnerPaymentsPage />
  </ProtectedRoute>
} />
<Route path="/dashboard/owner/messages" element={
  <ProtectedRoute requiredRoles={['OWNER']}>
    <OwnerMessagesPage />
  </ProtectedRoute>
} />
```

### Step 4: Fix Dashboard Navigation
```typescript
// In pages/TenantDashboard.tsx
import { useNavigate } from 'react-router-dom';

const TenantDashboard = () => {
  const navigate = useNavigate();
  
  const getQuickActions = () => [
    {
      title: 'Search Properties',
      description: 'Find your perfect stay',
      icon: 'search',
      action: () => navigate('/search')
    },
    {
      title: 'View Bookings',
      description: 'Manage your reservations',
      icon: 'calendar_month',
      action: () => navigate('/bookings')
    },
    {
      title: 'Make Payment',
      description: 'Pay for upcoming stays',
      icon: 'payments',
      action: () => navigate('/payments')
    },
    {
      title: 'Send Message',
      description: 'Chat with property owners',
      icon: 'chat',
      action: () => navigate('/messages')
    }
  ];
```

## Testing Strategy

### Navigation Testing Checklist:
1. **Side Navigation Bar Testing:**
   - [ ] Tenant Dashboard: All sidebar buttons navigate to correct pages
   - [ ] Owner Dashboard: All sidebar buttons navigate to correct pages
   - [ ] Admin Dashboard: All sidebar buttons navigate to correct pages

2. **Quick Actions Testing:**
   - [ ] Tenant Dashboard: All Quick Action buttons work correctly
   - [ ] Owner Dashboard: "Add New Listing" button works

3. **Header Navigation Testing:**
   - [ ] All header links navigate to correct pages
   - [ ] Profile picture navigates to profile page

4. **Route Testing:**
   - [ ] All new routes are accessible and properly protected
   - [ ] Route parameters work correctly
   - [ ] 404 handling works for invalid routes

### Browser Testing:
- Test navigation in Chrome, Firefox, Safari
- Test on mobile devices
- Test with JavaScript disabled
- Test with different screen sizes

## Expected Outcome

After implementing this plan:
1. All navigation buttons in dashboard sidebars will work correctly
2. Quick Actions buttons will navigate to their respective pages
3. Settings buttons will navigate to appropriate settings pages
4. All routes will be properly configured and accessible
5. Navigation will be consistent across all dashboard types

## Dependencies

- React Router DOM v6
- TypeScript
- Existing page components
- Authentication system

## Timeline

- **Phase 1 (Type Definitions)**: 30 minutes
- **Phase 2 (Routing)**: 45 minutes  
- **Phase 3 (Dashboard Updates)**: 1 hour
- **Phase 4 (Missing Components)**: 1.5 hours
- **Phase 5 (Header Updates)**: 30 minutes
- **Testing**: 1 hour

**Total Estimated Time**: 5.5 hours