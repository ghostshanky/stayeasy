
import React from 'react';
import { Page } from '../types';

const LandingPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111518] dark:text-gray-200">
            <div className="relative flex h-auto w-full flex-col font-display group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <div className="flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
                            
                            <main className="flex flex-col gap-10 md:gap-16">
                                <div className="relative mb-12">
                                    <div className="@container mt-5">
                                        <div className="@[480px]:p-0">
                                            <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4 text-center" aria-label="Vibrant, modern co-living space with young people interacting" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBT9ls834uSRBR6QcNga1tnsjJUI6lNVrObMuhyG9Etwl-O559TpoWZxFYWU9pz_BCRxAxfIssOFk6_CRuHJ6vIAcJebgkGLmqSv7qwXc5UiJ7mvE0c-Za8c0X-TeifdaEJNUjQl-2otWoOCQpqFswA2tJYgWryrpl__NCX36YT60bsqfRTjI6eWwcmDawhrBfiK3VfLekfyYXtGMh3Kv_4EiZ6gx5-q5thDBBShXVYQEORIn5eKHmFsNsgM0pRTwRswMMcurO3a-Q")' }}>
                                                <div className="flex flex-col gap-2">
                                                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                                                        Find Your Community. Find Your Home.
                                                    </h1>
                                                    <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal max-w-2xl mx-auto">
                                                        Budget-friendly hostels and PGs for students and professionals. Book your perfect stay today.
                                                    </h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 translate-y-1/2 w-full z-10 px-4">
                                        <div className="max-w-4xl mx-auto bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex-1 w-full">
                                                    <span className="material-symbols-outlined text-gray-500">search</span>
                                                    <input className="w-full bg-transparent focus:outline-none text-[#111518] dark:text-gray-200 placeholder-gray-500" placeholder="Enter a city or area" type="text" />
                                                </div>
                                                <div className="flex gap-3 flex-wrap justify-center w-full md:w-auto">
                                                    <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-800 px-4">
                                                        <p className="text-[#111518] dark:text-gray-200 text-sm font-medium leading-normal">Stay Type</p>
                                                        <span className="material-symbols-outlined text-[#111518] dark:text-gray-200">expand_more</span>
                                                    </button>
                                                    <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-800 px-4">
                                                        <p className="text-[#111518] dark:text-gray-200 text-sm font-medium leading-normal">Price Range</p>
                                                        <span className="material-symbols-outlined text-[#111518] dark:text-gray-200">expand_more</span>
                                                    </button>
                                                </div>
                                                <button onClick={() => navigate('searchResults')} className="flex w-full md:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                                                    <span className="truncate">Search</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <h2 className="text-[#111518] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Explore Our Top-Rated Properties</h2>
                                    <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <div className="flex items-stretch p-4 gap-4">
                                            <div className="flex h-full flex-1 flex-col gap-3 rounded-lg min-w-64">
                                                <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg flex flex-col" aria-label="Modern hostel dorm room with bunk beds" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU1Drh0rqdaWUHOGHsHiICFNbnQ0H-NW87EoE509p4WlCwhzCza6V8w2-eZdwgtmMOs8WFkwyXexpW2W2FLiQrYP_Hj3sc7MPe_kBFXQO9ld93fHFMe10GhDCmKc2C5adjSIlptWQmhqBsRmFL49gh81JsHhmJUhmxV5-CH-hUdca1QnVE-tZ1OY_qC10ltuMqxTIvsrgjy5CPNW-rWTPMYJsyf_Y_tcZFdOJA670eVebLgbWNqXMN4w-oUSRBbx76oME7uzHZN4U")' }}></div>
                                                <div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">Urban Nest Hostel</p>
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-orange-accent text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            <span className="text-sm font-medium">4.8</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Downtown, Delhi - ₹8,000/month</p>
                                                </div>
                                            </div>
                                            <div className="flex h-full flex-1 flex-col gap-3 rounded-lg min-w-64">
                                                <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg flex flex-col" aria-label="Cozy private room in a co-living PG" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC13YHX1O7VrmIU0suwYrYDLyNdFU-AwhzuI9dsDtO4Ni94PNefqgRTS7c-9SOPquiOIpp7stJSrsn08xMpKcYKz0wRSDFJI8-8NF2bAH85-y2MDp3ZbRupw-NSltq0731GNIhCdH2QW5eC-4NZQ1q7YgTWhXJJPba2JIMVPEt9XCXljIpOXHrfkORyrIKR0pqttFy9d42_jWkuzE8DHne47Uv_-fsB7xHcanLu7YgXsGq5IfzERgs9RMgoT_803jvEzWd01dP6UV4")' }}></div>
                                                <div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">Pro Co-Living PG</p>
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-orange-accent text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            <span className="text-sm font-medium">4.9</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Koramangala, Bangalore - ₹15,000/month</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                
                                <section className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">verified_user</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Verified Stays</h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Every property is manually verified by our team to ensure quality and safety for your peace of mind.</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">credit_card</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Secure Payments</h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Your booking and payment history, all in one place. Pay securely through our encrypted platform.</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">groups</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-[#111518] dark:text-white">Vibrant Community</h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Connect with like-minded students and professionals. Join events and build your network.</p>
                                        </div>
                                    </div>
                                </section>
                                
                                <section className="bg-gray-100 dark:bg-gray-900/50 py-12 md:py-20 rounded-xl">
                                    <div className="max-w-4xl mx-auto px-4 text-center">
                                        <h2 className="text-[#111518] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] mb-8">Hear from our Community</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-background-light dark:bg-surface-dark p-6 rounded-lg shadow-sm text-left flex flex-col">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img alt="Portrait of Rohan Sharma" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB71zZ2niCwr1eHdZ-9U4g1NXVWYwBN-ius2-nsjy18mrwwDRCU7nUfzoEGSzj8NcNfBhFZ86lvxoCA9XdtSeV3YW_Z4dAsuoWODueLIt8rZXQgta4lymu0mVPH7eBEZviQ-vZ8939xBC6rIFfMR76PZhzCHYgqv5Uvkn3zq3XJn6ryTZYZ_YoeNSh30vCbSxRaTmvHhQ_YEYRH-TXiutaufuXG5PwlUygZuxrC055rjhPa1-gOjDBiJDJnbVJhwFvshv-eq2HKedc" />
                                                    <div>
                                                        <p className="font-bold text-[#111518] dark:text-white">Rohan Sharma</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Software Engineer</p>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">"Finding a good PG in Bangalore was a nightmare until I found StayEasy. The process was so simple and the property was exactly as advertised. Highly recommend!"</p>
                                                <div className="flex items-center gap-1 text-orange-accent">
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                </div>
                                            </div>
                                            <div className="bg-background-light dark:bg-surface-dark p-6 rounded-lg shadow-sm text-left flex flex-col">
                                              <div className="flex items-center gap-4 mb-4">
                                                  <img alt="Portrait of Priya Mehta" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk0ry2qPtRRG3cgRCm7lWBThAeSO0OR5DKt1O6PcWTq09yC6wfceh8zsvhis0MMcJaZ1bHSPAh8MiMpp_j_0PvYyPRNa_9UK4xH8N1oM6NiPLSMhQqTgJeEVv3ovRqHbrOahoO2JsIfZheSMd_U-3bVYzf9BOAju8UWLoFEoorhFtHNEFGGUGsjWDMmj3lRTYiPpJSqAVt3xuTTdzQTuON75yg8XtzBZEj6o-GTFZNYiafAqazpuBQL8NCxFMyKGVu8bAa35lggJE" />
                                                  <div>
                                                      <p className="font-bold text-[#111518] dark:text-white">Priya Mehta</p>
                                                      <p className="text-sm text-gray-600 dark:text-gray-400">University Student</p>
                                                  </div>
                                              </div>
                                              <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">"As a student, safety was my top priority. StayEasy's verified listings gave me and my parents peace of mind. The community events are a great bonus!"</p>
                                              <div className="flex items-center gap-1 text-orange-accent">
                                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                                              </div>
                                          </div>
                                        </div>
                                    </div>
                                </section>

                                <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-10 pb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div>
                                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">StayEasy</h4>
                                            <ul className="space-y-2">
                                                <li><a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">About Us</a></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Discover</h4>
                                            <ul className="space-y-2">
                                                <li><a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">Trust & Safety</a></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Hosting</h4>
                                            <ul className="space-y-2">
                                                <li><a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">List your property</a></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#111518] dark:text-white mb-3">Support</h4>
                                            <ul className="space-y-2">
                                                <li><a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary" href="#">Help Center</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                                        <p>© 2024 StayEasy, Inc. All rights reserved.</p>
                                    </div>
                                </footer>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;