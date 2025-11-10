import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../client/src/config/brand';

const AboutUsPage = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111518] dark:text-gray-200 min-h-screen">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                
                {/* Hero Section */}
                <section className="text-center mb-16 md:mb-20">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#111518] dark:text-white mb-4">
                        About {BRAND.long}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Connecting students and professionals with perfect PG and hostel accommodations
                    </p>
                </section>

                {/* Service Description */}
                <section className="mb-16 md:mb-20">
                    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-6 text-center">
                            Our Service
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                    {BRAND.long} is a comprehensive platform designed to simplify the process of finding, booking, and managing PG (Paying Guest) and hostel accommodations. We understand the challenges students and young professionals face when searching for safe, affordable, and convenient housing options.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Our platform offers verified properties, secure payment processing, and direct communication with property owners, making your housing search experience seamless and trustworthy.
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                                            <h3 className="font-semibold text-lg">Why Choose Us?</h3>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                Verified Properties
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                Secure Payments
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                Direct Communication
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                Affordable Options
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Project Information */}
                <section className="mb-16 md:mb-20">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                            <span className="material-symbols-outlined text-sm">school</span>
                            <span className="text-sm font-medium">DBMS Assignment Project</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-4">
                            Project Background
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            This project has been developed as part of our Database Management Systems (DBMS) course assignment at Vishwakarma Institute of Technology. It demonstrates practical implementation of database concepts, web development, and user experience design.
                        </p>
                    </div>
                </section>

                {/* Team Members */}
                <section className="mb-16 md:mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-8 text-center">
                        Our Team
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Team Member 1 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white mb-1">Riddhi Rahul Kulkarni</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Computer Engineering</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Vishwakarma Institute of Technology</p>
                            <a href="mailto:riddhi.kulkarni24@vit.edu" className="text-primary hover:text-primary/80 text-sm">
                                riddhi.kulkarni24@vit.edu
                            </a>
                        </div>

                        {/* Team Member 2 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white mb-1">Waldron Lawrence Rodrigues</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Computer Engineering</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Vishwakarma Institute of Technology</p>
                            <a href="mailto:waldron.rodrigues241@vit.edu" className="text-primary hover:text-primary/80 text-sm">
                                waldron.rodrigues241@vit.edu
                            </a>
                        </div>

                        {/* Team Member 3 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white mb-1">Parshv Dharmendra Runwal</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Computer Engineering</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Vishwakarma Institute of Technology</p>
                            <a href="mailto:parshv.runwal24@vit.edu" className="text-primary hover:text-primary/80 text-sm">
                                parshv.runwal24@vit.edu
                            </a>
                        </div>

                        {/* Team Member 4 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                            </div>
                            <h3 className="font-bold text-lg text-[#111518] dark:text-white mb-1">Kunal Sandip Sable</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Computer Engineering</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Vishwakarma Institute of Technology</p>
                            <a href="mailto:kunal.sable24@vit.edu" className="text-primary hover:text-primary/80 text-sm">
                                kunal.sable24@vit.edu
                            </a>
                        </div>
                    </div>
                </section>

                {/* Guide Section */}
                <section className="mb-16 md:mb-20">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/10 dark:to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full mb-4">
                                <span className="material-symbols-outlined text-sm">school</span>
                                <span className="text-sm font-medium">Project Guide</span>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold text-[#111518] dark:text-white mb-2">
                                    Prof. Naina Kokate
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    Computer Engineering Department
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    Vishwakarma Institute of Technology, Pune, India
                                </p>
                                <a href="mailto:naina.kokate@vit.edu" className="text-primary hover:text-primary/80 font-medium">
                                    naina.kokate@vit.edu
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Project Links */}
                <section className="mb-16 md:mb-20">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-8">
                            Project Links
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="https://github.com/ghostshanky/stayeasy" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined">code</span>
                                <span className="font-medium">View on GitHub</span>
                                <span className="material-symbols-outlined text-sm">external_link</span>
                            </a>
                            <a 
                                href="https://stayeasy-alpha.vercel.app" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined">language</span>
                                <span className="font-medium">Live Demo</span>
                                <span className="material-symbols-outlined text-sm">external_link</span>
                            </a>
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
                        This project is developed for educational purposes as part of the DBMS course.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AboutUsPage;