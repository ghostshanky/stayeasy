import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Page Components
import ConfirmAndPayPage from './pages/ConfirmAndPayPage';
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
import NotFoundPage from './components/NotFoundPage';

const StayEasyLogo = () => (
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check for an auth token in local storage on initial load
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2 cursor-pointer">
                            <StayEasyLogo/>
                            <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">StayEasy</h2>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Home</Link>
                            <Link to="/search" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Explore</Link>
                            <Link to="/dashboard/owner" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">List your property</Link>
                            <button onClick={() => window.location.href = '/'} className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Help</button>
                        </div>
                         <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard/tenant" className="hidden sm:block px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-primary">
                                        My Bookings
                                    </Link>
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer" role="img" aria-label="User profile picture" onClick={() => window.location.href = '/dashboard/tenant'} style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5qBi4LYcxEf7poOfgp1nvI02JwO2nBE-L7DiWYgsDnVOPlFV20PVFECYvDtWx39ZkdnUfbddwBIM7w4oWBpKvjzoxBbT_2-QYJbnLbRkJUcRyuGvlPCD9MKMatUgmgUBTQ7rkuXVO5yvZFOSIsqq-jdNrTd6xKDi3ujbr6ILjmywR76yEOjjwCTLpefNsJPAy4-92Bwa2gkTv7toOUNsYQIzS_SxGVvVR6gQNxKs4URbbcJ1ZrCDmwhtoupKJF-EES8abFg52a5k")' }}></div>
                                    <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <span className="material-symbols-outlined">logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                        <span className="truncate">Log In</span>
                                    </Link>
                                    <Link to="/signup" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                        <span className="truncate">Sign Up</span>
                                    </Link>
                                </>
                            )}
                         </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/property/:id" element={<PropertyDetailsPage />} />
                    <Route path="/confirm" element={<ConfirmAndPayPage />} />
                    <Route path="/login" element={<AuthPage initialMode="login" setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/signup" element={<AuthPage initialMode="signup" setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/dashboard/owner" element={isAuthenticated ? <OwnerDashboard /> : <Navigate to="/login" />} />
                    <Route path="/dashboard/tenant" element={isAuthenticated ? <TenantDashboard /> : <Navigate to="/login" />} />
                    <Route path="/my-listings" element={isAuthenticated ? <MyListingsPage /> : <Navigate to="/login" />} />
                    <Route path="/bookings" element={isAuthenticated ? <BookingsPage /> : <Navigate to="/login" />} />
                    <Route path="/payments" element={isAuthenticated ? <PaymentsPage /> : <Navigate to="/login" />} />
                    <Route path="/messages" element={isAuthenticated ? <MessagesPage /> : <Navigate to="/login" />} />
                    <Route path="/verify-payment" element={isAuthenticated ? <PaymentVerificationPage /> : <Navigate to="/login" />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;