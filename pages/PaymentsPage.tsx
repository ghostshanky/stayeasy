import React, { useState } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';

const PaymentsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [activeTab, setActiveTab] = useState('history');

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <SideNavBar onNavigate={navigate} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Payment History</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">View and manage your payment records</p>
                            </div>
                        </div>

                        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Payment History
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Pending Payments
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {activeTab === 'history' ? (
                                <>
                                    <div className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-[#111518] dark:text-white">Modern Downtown Hostel</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Payment ID: PAY1234567890</p>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Oct 15, 2024</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#111518] dark:text-white">₹15,000</p>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Paid
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                            <span>Booking: Oct 25 - Nov 5, 2024</span>
                                            <span>UPI Reference: UPI1234567890</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20">Download Receipt</button>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">View Details</button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-[#111518] dark:text-white">Cozy PG in Koramangala</h3>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Payment ID: PAY0987654321</p>
                                                <p className="text-sm text-[#617989] dark:text-gray-400">Sep 10, 2024</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#111518] dark:text-white">₹12,000</p>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Paid
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                            <span>Booking: Sep 15 - Sep 30, 2024</span>
                                            <span>UPI Reference: UPI0987654321</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20">Download Receipt</button>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">View Details</button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-4 rounded-xl p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-[#111518] dark:text-white">Luxury Apartment in Whitefield</h3>
                                            <p className="text-sm text-[#617989] dark:text-gray-400">Booking ID: BK1111111111</p>
                                            <p className="text-sm text-[#617989] dark:text-gray-400">Due: Nov 1, 2024</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#111518] dark:text-white">₹25,000</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pending
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#617989] dark:text-gray-400">
                                        <span>Booking: Nov 1 - Nov 30, 2024</span>
                                        <span>Due in 3 days</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">Pay Now</button>
                                        <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">View Details</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PaymentsPage;
