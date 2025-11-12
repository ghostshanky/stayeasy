import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StayEasyLogo } from '../App';
import { BRAND } from '../client/src/config/brand';
import { useDarkMode } from '../client/src/contexts/DarkModeContext';
import { useAuth } from '../client/src/hooks/useAuth';
import MobileMenu from './MobileMenu';

export default function Header() {
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    
    const imageUrl = user?.user_metadata?.image_id
        ? `https://ik.imagekit.io/Shanky/${user.user_metadata.image_id}.png`
        : "/default_profile_pic.jpg";

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 cursor-pointer">
                            <StayEasyLogo />
                            <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">{BRAND.long}</h2>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Home</Link>
                            <Link to="/search" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Explore</Link>
                            <Link to="/help" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">Help</Link>
                            <Link to="/dashboard/owner" className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors">List your property</Link>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                            >
                                <span className="material-symbols-outlined">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Menu"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>

                            {user ? (
                                <>
                                    {/* Desktop My Bookings */}
                                    <Link to="/dashboard/tenant" className="hidden sm:block px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-primary dark:hover:text-primary">
                                        My Bookings
                                    </Link>
                                    
                                    {/* Profile */}
                                    <img
                                        src={imageUrl}
                                        onClick={() => navigate('/profile')}
                                        className="w-10 h-10 rounded-full cursor-pointer border border-gray-300 hover:scale-105 transition"
                                        alt="Profile"
                                    />
                                    
                                    {/* Logout */}
                                    <button onClick={logout} title="Logout" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <span className="material-symbols-outlined">logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Desktop Login/Signup */}
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Link to="/auth" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                            <span className="truncate">Log In</span>
                                        </Link>
                                        <Link to="/auth" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                            <span className="truncate">Sign Up</span>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                isAuthenticated={!!user}
            />
        </>
    );
}