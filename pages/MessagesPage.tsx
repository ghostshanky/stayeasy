import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import SideNavBar from '../components/SideNavBar';
import { supabase } from '../client/src/lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'host';
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: Message[];
  other_user?: {
    name: string;
    email: string;
    avatar_url?: string;
    id?: string;
  };
}

const MessagesPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchUserData();
        fetchConversations();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            // This would typically fetch from your API
            // For now, we'll use mock data
            const mockConversations: Conversation[] = [
                {
                    id: '1',
                    name: 'Modern Downtown Hostel',
                    lastMessage: 'Your booking has been confirmed!',
                    time: '2 hours ago',
                    unread: true,
                    messages: [
                        { id: '1', text: 'Hi! Your booking for Modern Downtown Hostel has been confirmed.', sender: 'host', time: '2 hours ago' },
                        { id: '2', text: 'Thank you! Looking forward to my stay.', sender: 'user', time: '1 hour ago' },
                        { id: '3', text: 'Great! Check-in is at 2 PM. See you soon!', sender: 'host', time: '30 min ago' }
                    ],
                    other_user: {
                        name: 'Host User',
                        email: 'host@example.com',
                        avatar_url: '/default_profile_pic.jpg'
                    }
                },
                {
                    id: '2',
                    name: 'Cozy PG in Koramangala',
                    lastMessage: 'Payment received successfully',
                    time: '1 day ago',
                    unread: false,
                    messages: [
                        { id: '1', text: 'Your payment has been processed successfully.', sender: 'host', time: '1 day ago' },
                        { id: '2', text: 'Perfect! Thank you for the confirmation.', sender: 'user', time: '1 day ago' }
                    ],
                    other_user: {
                        name: 'Property Manager',
                        email: 'manager@example.com',
                        avatar_url: '/default_profile_pic.jpg'
                    }
                }
            ];
            setConversations(mockConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (messageInput.trim() && selectedConversation) {
            try {
                // In a real app, this would send the message to the backend
                console.log('Sending message:', messageInput);
                
                // Add message to local state for immediate feedback
                const updatedConversations = conversations.map(conv => {
                    if (conv.id === selectedConversation) {
                        const newMessage: Message = {
                            id: Date.now().toString(),
                            text: messageInput,
                            sender: 'user',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        return {
                            ...conv,
                            lastMessage: messageInput,
                            time: 'Just now',
                            messages: [...conv.messages, newMessage]
                        };
                    }
                    return conv;
                });
                
                setConversations(updatedConversations);
                setMessageInput('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleCreateNewChat = async () => {
        if (!newChatEmail.trim()) {
            alert('Please enter an email address');
            return;
        }

        setCreatingChat(true);
        try {
            // Check if user exists in database
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('email', newChatEmail)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    alert('User with this email not found');
                } else {
                    alert('Error checking user: ' + error.message);
                }
                return;
            }

            // Create new conversation
            const newConversation: Conversation = {
                id: Date.now().toString(),
                name: (data as any).name || newChatEmail,
                lastMessage: 'Conversation started',
                time: 'Just now',
                unread: false,
                messages: [],
                other_user: {
                    name: (data as any).name || newChatEmail,
                    email: (data as any).email,
                    id: (data as any).id
                }
            };

            setConversations(prev => [newConversation, ...prev]);
            setNewChatEmail('');
            setShowNewChatModal(false);
            setSelectedConversation(newConversation.id);
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Failed to create chat');
        } finally {
            setCreatingChat(false);
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
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add</span>
                                New Chat
                            </button>
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
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="flex-shrink-0">
                                                            <img
                                                                src={conversation.other_user?.avatar_url || '/default_profile_pic.jpg'}
                                                                alt={conversation.other_user?.name || conversation.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline">
                                                                <h4 className="font-medium text-[#111518] dark:text-white truncate">
                                                                    {conversation.name}
                                                                </h4>
                                                                <span className="text-xs text-[#617989] dark:text-gray-400 ml-2 flex-shrink-0">
                                                                    {conversation.time}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-[#617989] dark:text-gray-400 truncate">
                                                                {conversation.lastMessage}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {conversation.unread && (
                                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2"></span>
                                                    )}
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

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start New Chat</h3>
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Enter email address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={newChatEmail}
                                onChange={(e) => setNewChatEmail(e.target.value)}
                                placeholder="Enter user's email"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateNewChat}
                                disabled={creatingChat}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {creatingChat ? 'Creating...' : 'Create Chat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
