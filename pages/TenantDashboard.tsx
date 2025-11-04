import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';

const TenantDashboard = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'payments'

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <SideNavBar onNavigate={navigate} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Welcome back, John!</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Here's a summary of your account and upcoming stays.</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
                            <button
                                onClick={() => setActiveTab('bookings')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'bookings' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                My Bookings
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Payment History
                            </button>
                        </div>

                        {activeTab === 'bookings' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Upcoming Stay</p>
                                    <p className="text-primary tracking-light text-2xl font-bold leading-tight">In 5 days</p>
                                </div>
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Total Bookings</p>
                                    <p className="text-[#111518] dark:text-white tracking-light text-2xl font-bold leading-tight">12</p>
                                </div>
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Total Spent</p>
                                    <p className="text-[#111518] dark:text-white tracking-light text-2xl font-bold leading-tight">₹95,000</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Last Payment</p>
                                    <p className="text-primary tracking-light text-2xl font-bold leading-tight">₹15,000</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">2 days ago</p>
                                </div>
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Total Payments</p>
                                    <p className="text-[#111518] dark:text-white tracking-light text-2xl font-bold leading-tight">8</p>
                                </div>
                                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <p className="text-[#111518] dark:text-gray-300 text-base font-medium leading-normal">Pending Payments</p>
                                    <p className="text-[#111518] dark:text-white tracking-light text-2xl font-bold leading-tight">1</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <h2 className="text-[#111518] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">
                                {activeTab === 'bookings' ? 'My Bookings' : 'Recent Payments'}
                            </h2>
                            <div className="mt-6 flex flex-col gap-4">
                                {activeTab === 'bookings' ? (
                                    <div className="flex flex-col sm:flex-row gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-center bg-no-repeat aspect-video sm:aspect-square bg-cover rounded-lg" aria-label="Modern hostel in downtown" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCq4GTePZYXZF_lXfObJWSaKHfjF7Jv647AhvYeAFkbaz5IS9FPSg-PYvORNeiIUZNrKTW3zlADjXjZAy1BU5Xj6VMGcDNWFIEMJS6xa2AOraHSbnf1pdYyg1arYdYorAIya84uoNRyN6_Im_CNZ5xew8XZNVJ5scA23P9lN3O4CPrBlojyWwKbBDb94DeNDAjklSDO-rZSSYXHr1D0VvoLxTyg6xuxS-w7jTIQGCe4PiDJGbTzEnhCWHrnEQgeLWURxpuqugI0RcI")' }}></div>
                                        <div className="flex flex-grow flex-col justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-medium uppercase tracking-wider text-primary">UPCOMING</p>
                                                <h3 className="text-lg font-bold text-[#111518] dark:text-white">Modern Downtown Hostel</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Oct 25, 2024 - Nov 5, 2024</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => navigate('propertyDetails')} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">View Details</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-[#111518] dark:text-white">Modern Downtown Hostel</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Payment ID: PAY1234567890</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#111518] dark:text-white">₹15,000</p>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Paid
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                            <span>Oct 15, 2024</span>
                                            <span>UPI Reference: UPI1234567890</span>
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
export default TenantDashboard;