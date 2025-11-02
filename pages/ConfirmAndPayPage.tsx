import React from 'react';
import { Page } from '../types';

const ConfirmAndPayPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#111518] dark:text-gray-200">
            <div className="relative flex h-auto w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <div className="flex flex-wrap justify-between gap-3 mb-8">
                            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72 text-gray-900 dark:text-white">Confirm and pay</h1>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                            {/* Left Column */}
                            <div className="lg:col-span-3 flex flex-col gap-8">
                                {/* Booking Summary Card */}
                                <div className="p-6 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-col gap-1 flex-grow">
                                            <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400">Private Room in Hostel</p>
                                            <p className="text-lg font-bold leading-tight text-gray-900 dark:text-white">The Student Hub, Koramangala</p>
                                            <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400 mt-1">456, 7th Main Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034</p>
                                        </div>
                                        <div className="w-28 h-20 sm:w-36 sm:h-24 bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-shrink-0" aria-label="Exterior view of The Student Hub hostel" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCgQGE7izJcR3jwda1gG0-HCkSl2okTfgEZxI1c7CNx_C-PmYGbbM26pDceT-XQUyW3IdmCZC6INFRRYN_g8dPqboFNYWqdtFxT7S5eGE07c_QnnEu5rlFqHCcqtYMqat8hxoPTOCTpPNCBmm6HeAuT0piB4LLcNLh-GmYb7ocxt5IFaTj4gRbLuTgd1T6jcoGIR4BhznyZfIGyDeng9fhkdL0UgEg3amjYW1IbvqOOBbFrB0Y9WI-lxxb8tvYEhf11Bs98h2Ar5yI")' }}></div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-solid border-gray-200 dark:border-gray-700">
                                        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] mb-4 text-gray-900 dark:text-white">Your trip</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-medium leading-normal text-gray-500 dark:text-gray-400">Dates</p>
                                                <p className="text-base font-semibold leading-normal text-gray-800 dark:text-gray-200">Sep 1 - Sep 30, 2024</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-medium leading-normal text-gray-500 dark:text-gray-400">Guests</p>
                                                <p className="text-base font-semibold leading-normal text-gray-800 dark:text-gray-200">1 guest</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Payment Form */}
                                <div className="flex flex-col gap-6">
                                    <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">Pay with</h2>
                                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                                        <button className="py-2 px-4 text-sm font-semibold border-b-2 border-primary text-primary">Credit/Debit Card</button>
                                        <button className="py-2 px-4 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">UPI</button>
                                        <button className="py-2 px-4 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Net Banking</button>
                                    </div>
                                    <form className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="card-number">Card Number</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">credit_card</span>
                                                <input className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-gray-900" id="card-number" placeholder="0000 0000 0000 0000" type="text" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="expiry-date">Expiry Date</label>
                                                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-gray-900" id="expiry-date" placeholder="MM / YY" type="text" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="cvv">CVV</label>
                                                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-gray-900" id="cvv" placeholder="123" type="text" />
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <input className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" id="save-card" name="save-card" type="checkbox" />
                                            <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300" htmlFor="save-card">Save card for future use</label>
                                        </div>
                                    </form>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-base text-success">lock</span>
                                        <p>This is a secure 256-bit SSL encrypted payment.</p>
                                    </div>
                                </div>
                                {/* Cancellation Policy */}
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Cancellation Policy</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Free cancellation before 12:00 PM on Aug 30. After that, cancel before 12:00 PM on Sep 1 for a partial refund. <a className="text-primary font-semibold underline" href="#">Learn more</a></p>
                                </div>
                                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={() => alert("Payment Confirmed!")} className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                        <span className="material-symbols-outlined">verified_user</span>
                                        Confirm and Pay
                                    </button>
                                </div>
                            </div>
                            {/* Right Column */}
                            <div className="lg:col-span-2">
                                <div className="sticky top-24 p-6 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-6">
                                    <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">Price details</h2>
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                            <p>₹12,000 x 1 month</p>
                                            <p>₹12,000</p>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                            <p>Service fee</p>
                                            <p>₹500</p>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                            <p>Taxes</p>
                                            <p>₹2,160</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-base font-bold text-gray-900 dark:text-white">Total (INR)</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">₹14,660</p>
                                    </div>
                                    {/* Host Info */}
                                    <div className="mt-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Meet your host</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-14" aria-label="Profile picture of the host, Priya" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDwP5tectrs4ndIek8_ZXFIrBqvRs3BILsZKiwZmsWyb5TneRt6tc3vvo2L9fIbeaBn3YZrZ-8OzVcBZ1jlLbPMJvRl6LWiKEDOYXld8CtsN5hrvVeTROMltdFwqLsRF9gYhOPzHtE5cRXLOfRl_vNE_2ZafyVOi7cxCBgj87GCxIN8L0p37mTSZCi8AYcNiC4MeeuPEhD6klJ1ZIsZmTKpuox3lKsugItNlmY0H_BKX3wGSqtHC1U5Cq141tdIU3rKQAweqCEcRLk")' }}></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 dark:text-gray-200">Priya Sharma</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Joined in 2022</p>
                                            </div>
                                            <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                Message Host
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ConfirmAndPayPage;