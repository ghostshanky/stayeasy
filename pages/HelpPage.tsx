import React from 'react';
import { BRAND } from '../client/src/config/brand';

const HelpPage = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111518] dark:text-gray-200 min-h-screen">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                
                {/* Hero Section */}
                <section className="text-center mb-16 md:mb-20">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">help_center</span>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#111518] dark:text-white mb-4">
                        Help Center
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Find answers to common questions and get support from our development team
                    </p>
                </section>

                {/* How to Use App */}
                <section className="mb-16 md:mb-20">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/10 dark:to-primary/5 rounded-xl p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-6 text-center">
                            How to Use {BRAND.long}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 text-center mb-8 max-w-3xl mx-auto leading-relaxed">
                            {BRAND.long} is a simple platform for finding, booking, and managing PG and hostel accommodations. 
                            Whether you're looking for a place to stay or want to list your property, our platform makes it easy and secure.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">search</span>
                                    </div>
                                    <h3 className="font-semibold text-lg">For Tenants</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Find your perfect PG or hostel accommodation with verified properties and secure booking.
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">home_work</span>
                                    </div>
                                    <h3 className="font-semibold text-lg">For Property Owners</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    List your property, manage bookings, and communicate with tenants all in one place.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step-by-Step User Guide */}
                <section className="mb-16 md:mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-8 text-center">
                        Step-by-Step Guide
                    </h2>
                    
                    {/* Tenant Guide */}
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold text-[#111518] dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            For Tenants
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Search for Properties</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Use the search bar on the home page to find PGs and hostels in your desired location.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Browse Listings</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Explore available properties, view photos, read reviews, and check amenities.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Contact Owner</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Send a message to the property owner to ask questions about the property.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Book Your Stay</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Confirm your booking dates and make payment through our secure UPI system.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Manage Your Booking</h4>
                                    <p className="text-gray-600 dark:text-gray-400">View your bookings, make payments, and communicate with the owner through your dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Owner Guide */}
                    <div>
                        <h3 className="text-xl font-semibold text-[#111518] dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">home_work</span>
                            For Property Owners
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">List Your Property</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Click "List your property" in the header and fill in your property details.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Add Photos & Details</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Upload high-quality photos and provide detailed information about your property.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Manage Availability</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Set your availability calendar and manage booking requests from tenants.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Communicate with Tenants</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Respond to messages and coordinate check-in details through the messaging system.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                                <div>
                                    <h4 className="font-semibold text-[#111518] dark:text-white mb-1">Verify Payments</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Confirm UPI payments and update booking status once payment is verified.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Help Center */}
                <section className="mb-16 md:mb-20">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                            <span className="material-symbols-outlined text-sm">support_agent</span>
                            <span className="text-sm font-medium">Need More Help?</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-4">
                            Help Center
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Our development team is here to help! Contact us directly or report issues on GitHub.
                        </p>
                    </div>

                    {/* Contact Team Members */}
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold text-[#111518] dark:text-white mb-6 text-center">
                            Contact Our Development Team
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Team Member 1 */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                </div>
                                <h3 className="font-bold text-base text-[#111518] dark:text-white mb-1">Riddhi Kulkarni</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Developer</p>
                                <a href="mailto:riddhi.kulkarni24@vit.edu" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                    <span className="material-symbols-outlined text-xs">email</span>
                                    riddhi.kulkarni24@vit.edu
                                </a>
                            </div>

                            {/* Team Member 2 */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                </div>
                                <h3 className="font-bold text-base text-[#111518] dark:text-white mb-1">Waldron Rodrigues</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Developer</p>
                                <a href="mailto:waldron.rodrigues241@vit.edu" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                    <span className="material-symbols-outlined text-xs">email</span>
                                    waldron.rodrigues241@vit.edu
                                </a>
                            </div>

                            {/* Team Member 3 */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                </div>
                                <h3 className="font-bold text-base text-[#111518] dark:text-white mb-1">Parshv Runwal</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Developer</p>
                                <a href="mailto:parshv.runwal24@vit.edu" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                    <span className="material-symbols-outlined text-xs">email</span>
                                    parshv.runwal24@vit.edu
                                </a>
                            </div>

                            {/* Team Member 4 */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                </div>
                                <h3 className="font-bold text-base text-[#111518] dark:text-white mb-1">Kunal Sable</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Developer</p>
                                <a href="mailto:kunal.sable24@vit.edu" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                    <span className="material-symbols-outlined text-xs">email</span>
                                    kunal.sable24@vit.edu
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Issues */}
                    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-8 md:p-12">
                        <h3 className="text-xl font-semibold text-[#111518] dark:text-white mb-6 text-center">
                            Report Issues on GitHub
                        </h3>
                        <div className="max-w-2xl mx-auto">
                            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
                                If you encounter any bugs, have suggestions, or want to request new features, 
                                please report an issue on our GitHub repository.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a 
                                    href="https://github.com/ghostshanky/stayeasy/issues" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined">bug_report</span>
                                    <span className="font-medium">Report Issue</span>
                                    <span className="material-symbols-outlined text-sm">link</span>
                                </a>
                                <a 
                                    href="https://github.com/ghostshanky/stayeasy" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <span className="material-symbols-outlined">code</span>
                                    <span className="font-medium">View Repository</span>
                                    <span className="material-symbols-outlined text-sm">link</span>
                                </a>
                            </div>
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                                    Tips for Good Issue Reports
                                </h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Describe the problem clearly and concisely</li>
                                    <li>• Include steps to reproduce the issue</li>
                                    <li>• Mention your browser and device information</li>
                                    <li>• Include screenshots if helpful</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="mb-16 md:mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-8 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-[#111518] dark:text-white mb-2">Is my payment information secure?</h3>
                            <p className="text-gray-600 dark:text-gray-400">Yes, we use secure UPI payment processing and never store your payment details on our servers.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-[#111518] dark:text-white mb-2">How do I cancel a booking?</h3>
                            <p className="text-gray-600 dark:text-gray-400">You can cancel bookings through your dashboard. Cancellation policies may vary by property.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-[#111518] dark:text-white mb-2">Can I list multiple properties?</h3>
                            <p className="text-gray-600 dark:text-gray-400">Yes, property owners can list multiple properties and manage them all from their dashboard.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-[#111518] dark:text-white mb-2">How are properties verified?</h3>
                            <p className="text-gray-600 dark:text-gray-400">Our team manually verifies each property listing to ensure accuracy and quality.</p>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} {BRAND.company}. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Still need help? Contact our development team or visit our GitHub repository.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default HelpPage;