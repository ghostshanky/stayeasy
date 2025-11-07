import React, { useState } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';

const BookingsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [activeTab, setActiveTab] = useState('upcoming');

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <SideNavBar onNavigate={navigate} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">My Bookings</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Manage your stay reservations</p>
                            </div>
                        </div>

                        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'past' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Past Bookings
                            </button>
                        </div>

                        <div className="flex flex-col">
                            <div className="mt-6 flex flex-col gap-4">
                                {activeTab === 'upcoming' ? (
                                    <div className="flex flex-col sm:flex-row gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-center bg-no-repeat aspect-video sm:aspect-square bg-cover rounded-lg" aria-label="Modern hostel in downtown" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCq4GTePZYXZF_lXfObJWSaKHfjF7Jv647AhvYeAFkbaz5IS9FPSg-PYvORNeiIUZNrKTW3zlADjXjZAy1BU5Xj6VMGcDNWFIEMJS6xa2AOraHSbnf1pdYyg1arYdYorAIya84uoNRyN6_Im_CNZ5xew8XZNVJ5scA23P9lN3O4CPrBlojyWwKbBDb94DeNDAjklSDO-rZSSYXHr1D0VvoLxTyg6xuxS-w7jTIQGCe4PiDJGbTzEnhCWHrnEQgeLWURxpuqugI0RcI")' }}></div>
                                        <div className="flex flex-grow flex-col justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-medium uppercase tracking-wider text-primary">UPCOMING</p>
                                                <h3 className="text-lg font-bold text-[#111518] dark:text-white">Modern Downtown Hostel</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Oct 25, 2024 - Nov 5, 2024</p>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Check-in: 2:00 PM</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => navigate('propertyDetails')} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">View Details</button>
                                                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Modify Booking</button>
                                                <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-[#111518] dark:text-white">Cozy PG in Koramangala</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Sep 15, 2024 - Sep 30, 2024</p>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Completed</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#111518] dark:text-white">₹12,000</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                    <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                            <span>Booking ID: BK1234567890</span>
                                            <span>Paid via UPI</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20">Book Again</button>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Leave Review</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BookingsPage;
