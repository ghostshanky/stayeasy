import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DarkModeProvider } from './client/src/contexts/DarkModeContext';
import { AuthProvider } from './client/src/hooks/useAuth';

// Page Components
import AboutUsPage from './pages/AboutUsPage';
import ConfirmAndPayPage from './pages/ConfirmAndPayPage';
import HelpPage from './pages/HelpPage';
import LandingPage from './pages/LandingPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import OwnerDashboard from './pages/OwnerDashboard';
import SearchResultsPage from './pages/SearchResultsPage';
import TenantDashboard from './pages/TenantDashboard';
import AuthPage from './pages/AuthPage';
import PaymentVerificationPage from './pages/PaymentVerificationPage';
import MyListingsPage from './pages/MyListingsPage';
import BookingsPage from './pages/BookingsPage';
import PaymentsPage from './pages/PaymentsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './components/NotFoundPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Owner-specific pages
import OwnerSettingsPage from './pages/OwnerSettingsPage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import OwnerPaymentsPage from './pages/OwnerPaymentsPage';
import OwnerMessagesPage from './pages/OwnerMessagesPage';
import AddPropertyForm from './components/owner/AddPropertyForm';

export const StayEasyLogo = () => (
    <div className="size-7 text-primary">
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="400.000000pt" height="40.000000pt" viewBox="0 0 185.000000 191.000000" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(-890.000000,158.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
                <path d="M867 1423 l-217 -155 0 -74 0 -74 60 0 60 0 0 49 0 48 148 103 c81 57 156 104 167 104 11 0 86 -47 168 -104 l147 -103 0 -203 0 -204 60 0 60 0 0 229 0 229 -207 148 c-115 81 -213 151 -218 155 -6 4 -107 -62 -228 -148z"/>
                <path d="M1000 1209 c0 -26 3 -30 23 -27 16 2 23 11 25 31 3 23 0 27 -22 27 -22 0 -26 -4 -26 -31z"/>
                <path d="M1120 1210 c0 -25 4 -30 25 -30 21 0 25 5 25 30 0 25 -4 30 -25 30 -21 0 -25 -5 -25 -30z"/>
                <path d="M1000 1085 c0 -20 5 -25 25 -25 20 0 25 5 25 25 0 20 -5 25 -25 25 -20 0 -25 -5 -25 -25z"/>
                <path d="M1120 1085 c0 -20 5 -25 25 -25 20 0 25 5 25 25 0 20 -5 25 -25 25 -20 0 -25 -5 -25 -25z"/>
                <path d="M280 650 l0 -340 180 0 180 0 0 45 c0 25 2 45 6 45 3 0 102 -27 221 -61 l216 -60 250 78 249 77 -5 63 c-10 132 -79 180 -259 182 -56 1 -58 2 -58 27 0 32 -34 93 -64 115 -12 9 -115 51 -230 93 l-207 76 -240 0 -239 0 0 -340z m250 0 l0 -220 -70 0 -70 0 0 220 0 220 70 0 70 0 0 -220z m414 150 c183 -67 206 -79 206 -109 0 -20 -149 -8 -223 19 -32 11 -62 18 -66 15 -9 -5 -34 -95 -28 -101 2 -2 43 -17 90 -34 86 -30 90 -30 290 -30 170 0 206 -3 226 -16 12 -9 19 -20 14 -24 -4 -4 -90 -33 -189 -64 l-182 -56 -203 55 c-112 31 -212 58 -221 61 -16 5 -18 22 -18 180 l0 174 58 0 c47 0 94 -13 246 -70z"/>
            </g>
        </svg>
    </div>
);

function App() {
    return (
        <DarkModeProvider>
            <AuthProvider>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/about" element={<AboutUsPage />} />
                            <Route path="/help" element={<HelpPage />} />
                            <Route path="/search" element={<SearchResultsPage />} />
                            <Route path="/property/:id" element={<PropertyDetailsPage />} />
                            <Route path="/confirm" element={<ConfirmAndPayPage />} />
                            <Route path="/auth" element={<AuthPage />} />
                            
                            {/* Unauthorized Page */}
                            <Route path="/unauthorized" element={<UnauthorizedPage />} />
                            
                            {/* Authenticated Routes (require login) */}
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/bookings" element={
                                <ProtectedRoute>
                                    <BookingsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/payments" element={
                                <ProtectedRoute>
                                    <PaymentsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/messages" element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/verify-payment" element={
                                <ProtectedRoute>
                                    <PaymentVerificationPage />
                                </ProtectedRoute>
                            } />
                            
                            {/* Owner Routes (require OWNER role) */}
                            <Route path="/dashboard/owner" element={
                                <ProtectedRoute requiredRoles={['OWNER']}>
                                    <OwnerDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/my-listings" element={
                                <ProtectedRoute requiredRoles={['OWNER']}>
                                    <MyListingsPage />
                                </ProtectedRoute>
                            } />
                            
                            {/* Tenant Routes (require TENANT or OWNER role) */}
                            <Route path="/dashboard/tenant" element={
                                <ProtectedRoute requiredRoles={['TENANT', 'OWNER']}>
                                    <TenantDashboard />
                                </ProtectedRoute>
                            } />
                            
                            {/* Admin Routes (require ADMIN role) */}
                            <Route path="/dashboard/admin" element={
                                <ProtectedRoute requiredRoles={['ADMIN']}>
                                    <Navigate to="/admin-dashboard" replace />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin-dashboard/*" element={
                                <ProtectedRoute requiredRoles={['ADMIN']}>
                                    <Navigate to="/admin-dashboard" replace />
                                </ProtectedRoute>
                            } />

                            {/* Owner Routes */}
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
                            <Route path="/owner/add-property" element={
                                <ProtectedRoute requiredRoles={['OWNER']}>
                                    <AddPropertyWrapper />
                                </ProtectedRoute>
                            } />
                            
                            {/* 404 Route */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                style: {
                                    background: '#10b981',
                                },
                            },
                            error: {
                                style: {
                                    background: '#ef4444',
                                },
                            },
                        }}
                    />
                    </div>
            </AuthProvider>
        </DarkModeProvider>
    );
}

// Wrapper component for AddPropertyForm with proper props
const AddPropertyWrapper: React.FC = () => {
    const navigate = useNavigate();
    
    const handlePropertyAdded = () => {
        navigate('/dashboard/owner');
    };
    
    const handleCancel = () => {
        navigate('/dashboard/owner');
    };
    
    return (
        <AddPropertyForm
            onPropertyAdded={handlePropertyAdded}
            onCancel={handleCancel}
        />
    );
}

export default App;