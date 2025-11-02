import React, { useState } from 'react';
import { Page } from '../types';
import MessageHostModal from '../components/MessageHostModal';
import { sendMessageToHost } from '../api';

const PropertyDetailsPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const hostName = "Priya"; // This would typically come from property data

    const handleSendMessage = async (message: string) => {
        try {
            await sendMessageToHost(hostName, message);
            // Optionally show a success toast/notification
            alert('Message sent successfully!');
            setIsMessageModalOpen(false);
        } catch (error) {
            alert('Failed to send message. Please try again.');
            console.error(error);
        }
    };


    return (
        <>
            <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
                <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <a className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium" href="#">Home</a>
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                        <a className="text-gray-500 dark:text-gray-400 hover:text-primary text-sm font-medium" href="#">Mumbai</a>
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/</span>
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">Sunnyvale Hostel</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">Modern &amp; Cozy PG near Andheri West</p>
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">star</span>
                                    <span>4.8 (120 Reviews)</span>
                                </div>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>Andheri West, Mumbai, Maharashtra</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex gap-2 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">
                                <span className="material-symbols-outlined text-base">ios_share</span>
                                <span className="truncate">Share</span>
                            </button>
                            <button className="flex gap-2 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">
                                <span className="material-symbols-outlined text-base">favorite</span>
                                <span className="truncate">Save</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-2 gap-2 mb-10 h-[500px] rounded-xl overflow-hidden">
                        <div className="col-span-2 row-span-2 bg-center bg-no-repeat bg-cover" aria-label="Main view of the hostel room with a bed and a desk" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7OirUwF-piUBH43Og4XHbDyxDXRKYKadJw4QdLPNOErwC1_ozRl-SDAf1fsJC0vQ1OHnAlv4D6TR7tuz7hUIWCcY5ttyj4pYJHn1EQkLfCTrL4OY2I56PJw35rLBkk7Y7vg65KeR8n130pM-jb5g1MU7Ul4l-_QAUiTUKhgawJLEv48PPfgnCH288PqbKsSt7W0F4xOyw-cPCFBZVIpN2mHPjJnBLORITsFeYIbjo9V4aPO7uNUlMZX9EISDyKkWjMOLoGYpmwCo")' }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Common area with sofas and a coffee table" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7Ug-Pwb-rv_aSaME8nt11F1VoHDB3tHufNCEH5u3o48V5aPoG9KwWtthplgBzBiZeBlcW6gNfFGNHG217BZcAI0Q913glkSPglihnHSAlyYjVgXyC5skgopUat9zgRcfBsrRhISY2THCsq55sPHjXo9bBCU7vlEkQmL7g5hj9vyQguMJDvQ0OCm0uEN25NJAe83WWwjYcCrEPKGpAgj1fIhGl9dPhoj9F8wftAaxRzHN9nrHkWmD5jvdUe8YfSJ7QrAtInkx4Ukc")' }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Clean and modern bathroom with a shower" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuATwvy-h3km1lXU42gVPFLYXb4mUjXV4s64vrToTm7hMgeNwnxPgHb2LbP0DlXcH0IIqOFjumAfKVruWyFMvXYYRj6wC7JHQ-oLrLhqsZvV_-DxjaZVcKD_tTnceopq9307nrnAKHk-tfaqfll8XU7WXltkAUD8zaRQf6Wv3G9nyal7c92o13c4qU1XynN1PyuBBHnrcFztdZEv8f-wHhUnIyINzl0ThHQUyPvvRHmgmNEM72TOOBtx4ilDdJkzhx2Fz3T6OYwjb24")' }}></div>
                        <div className="bg-center bg-no-repeat bg-cover" aria-label="Kitchenette area with microwave and fridge" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBsFyACWoUbJeZ5nval1Gw6zwGM8ROIEfhHOflUXOV7x13jaPkN4FAVrtnm9Sri6eLqtwgap0QbZF4NYycmXT5syJkzD-PWiewSYQWAGoGSFBFdPknOknjOncSWfTwymoSFK2jvORL2DdOWjkHSBygh7CQHm3skNsCVGkSmbEs57qUWAKaQdqMLYaPpw9twAxLMrnxQS4JcXPTr7B5L2WG77D_iRdJVG8fRxq_ZfcRJvVssxCCAi37Z6ueGPm-BOeAyqjb_pAo4uzI")' }}></div>
                        <div className="relative bg-center bg-no-repeat bg-cover" aria-label="Exterior view of the building" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAf92ctgGpbKbZzdXDYB_OxyeXEz7eMcmSwFd9NujgrDvMc6tJ9XB3S13l-LeVVicMtNZvP6Q4Nr1YCpe9vpOxTJxwTmWxap6S10eBTpspvf6XaNda6-QTmZCewjf9barm5PqhMb3TagoKPC7ywu0tFCT24priMhYvsSNo6tfGYPWfncNypFLghqMvqm8LjU5SjHUvdju13pAPiy7ySuuoyuW_4rWA3UVkF_iWNF9UWqQOKJkMAlye-SE8bAd63VkVKXSiU4JRi854")' }}>
                            <button className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center text-white font-bold hover:bg-black/50">Show all photos</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">Private Room in a PG hosted by Priya</h2>
                                        <p className="text-gray-500 dark:text-gray-400">2-person sharing • 1 Bathroom • Kitchenette</p>
                                    </div>
                                </div>
                            </div>
                            <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4">What this place offers</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">wifi</span><span className="text-gray-600 dark:text-gray-300">High-speed Wi-Fi</span></div>
                                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">ac_unit</span><span className="text-gray-600 dark:text-gray-300">Air Conditioning</span></div>
                                </div>
                            </div>
                            <div className="py-6">
                                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">star</span>
                                    <span>4.8 • 120 Reviews</span>
                                </h3>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    ₹15,000 <span className="text-base font-normal text-gray-500 dark:text-gray-400">/ month</span>
                                </p>
                                <div className="space-y-4">
                                    <button onClick={() => navigate('confirmAndPay')} className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-colors">
                                        <span>Request to Book</span>
                                    </button>
                                    <button onClick={() => setIsMessageModalOpen(true)} className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                        <span>Contact Owner</span>
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">You won't be charged yet</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <MessageHostModal 
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                hostName={hostName}
                onSend={handleSendMessage}
            />
        </>
    );
};
export default PropertyDetailsPage;
