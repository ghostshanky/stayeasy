import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { useNavigate } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

import toast from 'react-hot-toast';
import { BRAND } from '../config/brand';

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

const MessagesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial fetch of conversations
    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !user) return;

        // Listen for new messages
        socket.on('new_message', (message: any) => {
            handleNewMessage(message);
        });

        // Listen for message notifications (for unread counts/list updates)
        socket.on('message_notification', (data: any) => {
            // If we're not already viewing this chat, update the list
            if (selectedConversation !== data.chatId) {
                updateConversationList(data.message, data.chatId, true);
            }
        });

        return () => {
            socket.off('new_message');
            socket.off('message_notification');
        };
    }, [socket, user, selectedConversation, conversations]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (selectedConversation) {
            scrollToBottom();
        }
    }, [conversations, selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleNewMessage = (message: any) => {
        const chatId = message.chat_id;
        const isCurrentUserSender = message.sender_id === user?.id;

        setConversations(prev => {
            return prev.map(conv => {
                if (conv.id === chatId) {
                    const newMessage: Message = {
                        id: message.id,
                        text: message.content,
                        sender: isCurrentUserSender ? 'user' : 'host',
                        time: new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    };

                    // Only add if not already present (deduplication)
                    const messageExists = conv.messages.some(m => m.id === newMessage.id);
                    if (messageExists) return conv;

                    return {
                        ...conv,
                        lastMessage: message.content,
                        time: 'Just now',
                        messages: [...conv.messages, newMessage],
                        unread: !isCurrentUserSender && selectedConversation !== chatId
                    };
                }
                return conv;
            }).sort((a, b) => {
                // Move updated conversation to top
                if (a.id === chatId) return -1;
                if (b.id === chatId) return 1;
                return 0;
            });
        });
    };

    const updateConversationList = (message: any, chatId: string, incrementUnread: boolean) => {
        setConversations(prev => {
            const convIndex = prev.findIndex(c => c.id === chatId);
            if (convIndex === -1) {
                // New conversation, we might need to fetch it or just ignore until refresh
                // For now, let's fetch conversations to be safe
                fetchConversations();
                return prev;
            }

            const updatedConv = {
                ...prev[convIndex],
                lastMessage: message.content,
                time: 'Just now',
                unread: incrementUnread ? true : prev[convIndex].unread
            };

            // Move to top
            const newConvs = [...prev];
            newConvs.splice(convIndex, 1);
            newConvs.unshift(updatedConv);
            return newConvs;
        });
    };

    const fetchConversations = async () => {
        try {
            if (!user) return;

            const response = await apiClient.get('/api/messages/conversations');

            if (response.success && response.data) {
                const conversationsData: Conversation[] = response.data.map((conv: any) => ({
                    id: conv.id,
                    name: conv.otherUser?.name || 'Unknown User',
                    lastMessage: conv.lastMessage?.content || 'No messages yet',
                    time: conv.lastMessage
                        ? new Date(conv.lastMessage.createdAt).toLocaleDateString()
                        : 'Just now',
                    unread: conv.unreadCount > 0,
                    messages: [],
                    other_user: {
                        name: conv.otherUser?.name || 'Unknown User',
                        email: conv.otherUser?.email || '',
                        avatar_url: conv.otherUser?.avatarUrl || BRAND.defaultAvatar,
                        id: conv.otherUser?.id
                    }
                }));

                setConversations(conversationsData);
            } else {
                console.error('Failed to fetch conversations:', response.error);
            }
        } catch (error) {
            console.error('API call failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for a specific conversation when selected
    useEffect(() => {
        if (selectedConversation && user) {
            fetchMessages(selectedConversation);

            // Join the chat room via socket
            if (socket) {
                socket.emit('join_chat', selectedConversation);
            }
        }

        return () => {
            if (selectedConversation && socket) {
                socket.emit('leave_chat', selectedConversation);
            }
        };
    }, [selectedConversation, user, socket]);

    const fetchMessages = async (chatId: string) => {
        try {
            const conversation = conversations.find(c => c.id === chatId);
            if (!conversation?.other_user?.id) return;

            const response = await apiClient.get(`/messages/conversation/${conversation.other_user.id}`);

            if (response.success && response.data) {
                const fetchedMessages = response.data.messages.map((msg: any) => ({
                    id: msg.id,
                    text: msg.content,
                    sender: msg.sender_id === user?.id ? 'user' : 'host',
                    time: new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }));

                setConversations(prev => prev.map(conv => {
                    if (conv.id === chatId) {
                        return {
                            ...conv,
                            messages: fetchedMessages,
                            unread: false // Mark as read when fetched/viewed
                        };
                    }
                    return conv;
                }));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (messageInput.trim() && selectedConversation && user) {
            try {
                const conversation = conversations.find(c => c.id === selectedConversation);
                const recipientId = conversation?.other_user?.id;

                if (!recipientId) {
                    toast.error('Cannot send message: Recipient not found');
                    return;
                }

                // Send message via API (which will trigger socket event from server)
                const response = await apiClient.post('/api/messages', {
                    recipientId: recipientId,
                    content: messageInput.trim()
                });

                if (response.success && response.data) {
                    // We don't need to manually update state here because the socket 'new_message' event
                    // will handle it. However, for instant feedback (optimistic UI), we can add it.
                    // But to avoid duplication with the socket event, it's safer to rely on the socket
                    // or handle deduplication in handleNewMessage.

                    setMessageInput('');
                } else {
                    throw new Error(response.error?.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                toast.error('Failed to send message. Please try again.');
            }
        }
    };

    const handleCreateNewChat = async () => {
        if (!newChatEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        setCreatingChat(true);
        try {
            const chatResponse = await apiClient.post('/api/messages', {
                recipientId: newChatEmail,
                content: 'Conversation started',
                propertyId: null
            });

            if (chatResponse.success && chatResponse.data) {
                // Refresh conversations to get the new one
                await fetchConversations();
                setNewChatEmail('');
                setShowNewChatModal(false);

                // Select the new conversation if we can find it
                if (chatResponse.data.chat_id) {
                    setSelectedConversation(chatResponse.data.chat_id);
                }
            } else {
                throw new Error(chatResponse.error?.message || 'Failed to create chat');
            }
        } catch (error) {
            console.error('Error creating chat:', error);
            toast.error('Failed to create chat');
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
                                <p className="text-[#617989] dark:text-gray-400 text-base font-normal leading-normal">
                                    Communicate with property owners and managers
                                    {isConnected ? <span className="ml-2 text-green-500 text-xs">● Connected</span> : <span className="ml-2 text-red-500 text-xs">● Disconnected</span>}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    New Chat
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                            <div className="flex h-[600px]">
                                {/* Conversations List */}
                                <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                        <h3 className="font-bold text-[#111518] dark:text-white">Conversations</h3>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        {conversations.map((conversation) => (
                                            <div
                                                key={conversation.id}
                                                onClick={() => setSelectedConversation(conversation.id)}
                                                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedConversation === conversation.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="flex-shrink-0">
                                                            <img
                                                                src={conversation.other_user?.avatar_url || BRAND.defaultAvatar}
                                                                alt={conversation.other_user?.name || conversation.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = BRAND.defaultAvatar;
                                                                    target.onerror = null;
                                                                }}
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
                                                            <p className={`text-sm truncate ${conversation.unread ? 'font-semibold text-gray-900 dark:text-white' : 'text-[#617989] dark:text-gray-400'}`}>
                                                                {conversation.lastMessage}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {conversation.unread && (
                                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2 mt-2"></span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/30">
                                    {selectedConversation ? (
                                        <>
                                            {/* Messages Header */}
                                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={conversations.find(c => c.id === selectedConversation)?.other_user?.avatar_url || BRAND.defaultAvatar}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <h3 className="font-bold text-[#111518] dark:text-white">
                                                        {conversations.find(c => c.id === selectedConversation)?.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Messages List */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {conversations.find(c => c.id === selectedConversation)?.messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.sender === 'user'
                                                                ? 'bg-primary text-white rounded-br-none'
                                                                : 'bg-white dark:bg-gray-800 text-[#111518] dark:text-gray-200 shadow-sm rounded-bl-none'
                                                                }`}
                                                        >
                                                            <p className="text-sm">{message.text}</p>
                                                            <p className={`text-[10px] mt-1 text-right ${message.sender === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                                                                {message.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Message Input */}
                                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={messageInput}
                                                        onChange={(e) => setMessageInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        placeholder="Type your message..."
                                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-800 text-[#111518] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                    />
                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={!messageInput.trim()}
                                                        className="w-12 h-12 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-primary/20"
                                                    >
                                                        <span className="material-symbols-outlined">send</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center p-8">
                                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <span className="material-symbols-outlined text-4xl text-gray-400">chat_bubble_outline</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-[#111518] dark:text-white mb-2">Select a conversation</h3>
                                                <p className="text-[#617989] dark:text-gray-400 max-w-xs mx-auto">
                                                    Choose a conversation from the list to start messaging or start a new chat.
                                                </p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-96 max-w-md mx-4 shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start New Chat</h3>
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={newChatEmail}
                                onChange={(e) => setNewChatEmail(e.target.value)}
                                placeholder="Enter user's email"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateNewChat}
                                disabled={creatingChat}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-primary/20"
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
