import React, { useState } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';

const MessagesPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
    const [messageInput, setMessageInput] = useState('');

    const conversations = [
        {
            id: 1,
            name: 'Modern Downtown Hostel',
            lastMessage: 'Your booking has been confirmed!',
            time: '2 hours ago',
            unread: true,
            messages: [
                { id: 1, text: 'Hi! Your booking for Modern Downtown Hostel has been confirmed.', sender: 'host', time: '2 hours ago' },
                { id: 2, text: 'Thank you! Looking forward to my stay.', sender: 'user', time: '1 hour ago' },
                { id: 3, text: 'Great! Check-in is at 2 PM. See you soon!', sender: 'host', time: '30 min ago' }
            ]
        },
        {
            id: 2,
            name: 'Cozy PG in Koramangala',
            lastMessage: 'Payment received successfully',
            time: '1 day ago',
            unread: false,
            messages: [
                { id: 1, text: 'Your payment has been processed successfully.', sender: 'host', time: '1 day ago' },
                { id: 2, text: 'Perfect! Thank you for the confirmation.', sender: 'user', time: '1 day ago' }
            ]
        }
    ];

    const handleSendMessage = () => {
        if (messageInput.trim() && selectedConversation) {
            // In a real app, this would send the message to the backend
            console.log('Sending message:', messageInput);
            setMessageInput('');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
            <div className="flex h-full grow">
                <SideNavBar onNavigate={navigate} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <div className="flex min-w-72 flex-col gap-2">
                                <p className="text-[#111518] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Messages</p>
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">Communicate with property owners and managers</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                            <div className="flex h-96">
                                {/* Conversations List */}
                                <div className="w-1/3 border-r border-gray-200 dark:border-gray-800">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                        <h3 className="font-bold text-[#111518] dark:text-white">Conversations</h3>
                                    </div>
                                    <div className="overflow-y-auto h-full">
                                        {conversations.map((conversation) => (
                                            <div
                                                key={conversation.id}
                                                onClick={() => setSelectedConversation(conversation.id)}
                                                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                                    selectedConversation === conversation.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-[#111518] dark:text-white">{conversation.name}</h4>
                                                        <p className="text-sm text-[#617989] dark:text-gray-400 truncate">{conversation.lastMessage}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs text-[#617989] dark:text-gray-400">{conversation.time}</span>
                                                        {conversation.unread && (
                                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 flex flex-col">
                                    {selectedConversation ? (
                                        <>
                                            {/* Messages Header */}
                                            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                                <h3 className="font-bold text-[#111518] dark:text-white">
                                                    {conversations.find(c => c.id === selectedConversation)?.name}
                                                </h3>
                                            </div>

                                            {/* Messages List */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {conversations.find(c => c.id === selectedConversation)?.messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                                message.sender === 'user'
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-gray-100 dark:bg-gray-800 text-[#111518] dark:text-gray-200'
                                                            }`}
                                                        >
                                                            <p className="text-sm">{message.text}</p>
                                                            <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-100' : 'text-[#617989] dark:text-gray-400'}`}>
                                                                {message.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Message Input */}
                                            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={messageInput}
                                                        onChange={(e) => setMessageInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        placeholder="Type your message..."
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#111518] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={!messageInput.trim()}
                                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">chat</span>
                                                <h3 className="text-lg font-medium text-[#111518] dark:text-white mb-2">Select a conversation</h3>
                                                <p className="text-[#617989] dark:text-gray-400">Choose a conversation from the list to start messaging</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MessagesPage;
