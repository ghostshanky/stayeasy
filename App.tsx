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
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
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