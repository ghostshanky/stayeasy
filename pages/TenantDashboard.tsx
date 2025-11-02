import React from 'react';
import { Page } from '../types';

const TenantDashboard = ({ navigate }: { navigate: (page: Page) => void }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sticky top-0 h-screen">
                    <div className="flex h-full flex-col justify-between">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" aria-label="John Doe's profile picture" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5qBi4LYcxEf7poOfgp1nvI02JwO2nBE-L7DiWYgsDnVOPlFV20PVFECYvDtWx39ZkdnUfbddwBIM7w4oWBpKvjzoxBbT_2-QYJbnLbRkJUcRyuGvlPCD9MKMatUgmgUBTQ7rkuXVO5yvZFOSIsqq-jdNrTd6xKDi3ujbr6ILjmywR76yEOjjwCTLpefNsJPAy4-92Bwa2gkTv7toOUNsYQIzS_SxGVvVR6gQNxKs4URbbcJ1ZrCDmwhtoupKJF-EES8abFg52a5k")' }}></div>
                                <div className="flex flex-col">
                                    <h1 className="text-[#111518] dark:text-gray-100 text-base font-medium leading-normal">John Doe</h1>
                                    <p className="text-[#617989] dark:text-gray-400 text-sm font-normal leading-normal">Tenant</p>
                                </div>
                            </div>
                            <nav className="flex flex-col gap-2">
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary" href="#">
                                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                                    <p className="text-sm font-medium leading-normal">Dashboard Home</p>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" href="#">
                                    <span className="material-symbols-outlined">credit_card</span>
                                    <p className="text-sm font-medium leading-normal">Payment History</p>
                                </a>
                            </nav>
                        </div>
                        <div className="flex flex-col gap-1">
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" href="#">
                                <span className="material-symbols-outlined">logout</span>
                                <p className="text-sm font-medium leading-normal">Logout</p>
                            </a>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Welcome back, John!</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Here's a summary of your account and upcoming stays.</p>
                            </div>
                        </div>
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
                                <p className="text-[#111518] dark:text-white tracking-light text-2xl font-bold leading-tight">$1,250</p>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[#111518] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">My Bookings</h2>
                            <div className="mt-6 flex flex-col gap-4">
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
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
export default TenantDashboard;
