import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string;
    role: string;
  };
  property?: {
    id: string;
    title: string;
  };
  created_at: string;
  read: boolean;
}

interface MessageCardProps {
  message: Message;
  onMarkAsRead: (id: string) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onMarkAsRead }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFromTenant = message.sender.role === 'TENANT';
  const isFromOwner = message.sender.role === 'OWNER';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${!message.read ? 'border-l-4 border-primary' : ''}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              {isFromTenant ? 'person' : 'business'}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  {message.sender.name}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {message.sender.role}
                </span>
                {message.property && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                    {message.property.title}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(message.created_at)}
              </p>
            </div>
            {!message.read && (
              <button
                onClick={() => onMarkAsRead(message.id)}
                className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Mark as Read
              </button>
            )}
          </div>
          
          <div className={`p-4 rounded-lg ${isFromTenant ? 'bg-gray-50 dark:bg-gray-700' : 'bg-primary/5 dark:bg-primary/10'}`}>
            <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerMessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get all properties owned by this user
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        if (propertiesError) {
          console.warn('Database connection failed, using sample messages:', propertiesError.message);
          // Use sample messages for development/testing
          const sampleMessages: Message[] = [
            {
              id: crypto.randomUUID(),
              content: 'Hi, I\'m interested in your Modern PG near Tech Park. Is it still available for next month?',
              sender: {
                id: crypto.randomUUID(),
                name: 'John Doe',
                role: 'TENANT'
              },
              receiver: {
                id: user.id,
                name: 'Property Owner',
                role: 'OWNER'
              },
              property: {
                id: crypto.randomUUID(),
                title: 'Modern PG near Tech Park'
              },
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              read: false
            },
            {
              id: crypto.randomUUID(),
              content: 'Yes, it\'s available! Would you like to schedule a viewing?',
              sender: {
                id: user.id,
                name: 'Property Owner',
                role: 'OWNER'
              },
              receiver: {
                id: crypto.randomUUID(),
                name: 'John Doe',
                role: 'TENANT'
              },
              property: {
                id: crypto.randomUUID(),
                title: 'Modern PG near Tech Park'
              },
              created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
              read: true
            },
            {
              id: crypto.randomUUID(),
              content: 'Hello, I saw your listing for the Cozy Hostel. What are the amenities included?',
              sender: {
                id: crypto.randomUUID(),
                name: 'Sarah Wilson',
                role: 'TENANT'
              },
              receiver: {
                id: user.id,
                name: 'Property Owner',
                role: 'OWNER'
              },
              property: {
                id: crypto.randomUUID(),
                title: 'Cozy Hostel in City Center'
              },
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              read: false
            },
            {
              id: crypto.randomUUID(),
              content: 'The hostel includes WiFi, laundry service, 24/7 security, and common areas.',
              sender: {
                id: user.id,
                name: 'Property Owner',
                role: 'OWNER'
              },
              receiver: {
                id: crypto.randomUUID(),
                name: 'Sarah Wilson',
                role: 'TENANT'
              },
              property: {
                id: crypto.randomUUID(),
                title: 'Cozy Hostel in City Center'
              },
              created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
              read: true
            }
          ];
          setMessages(sampleMessages);
          setLoading(false);
          return;
        }

        const propertyIds = properties?.map((p: any) => p.id) || [];

        // Get all messages where this user is the receiver
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender (
              id,
              name,
              role
            ),
            receiver (
              id,
              name,
              role
            ),
            properties (
              id,
              title
            )
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filterMessages = (messages: Message[], status?: string) => {
    if (status === 'all') return messages;
    if (status === 'unread') return messages.filter(msg => !msg.read);
    if (status === 'read') return messages.filter(msg => msg.read);
    return messages;
  };

  const getUnreadCount = () => {
    return messages.filter(msg => !msg.read).length;
  };

  if (loading) {
    return (
      <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
        <OwnerSideNavBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            <div className="text-center py-10">Loading Messages...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Messages</h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary">Communicate with tenants</p>
              </div>
              {getUnreadCount() > 0 && (
                <div className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-full text-sm font-medium">
                  {getUnreadCount()} unread
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              All Messages
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'unread' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Unread ({getUnreadCount()})
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'read' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Read
            </button>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {filterMessages(messages, activeTab).length > 0 ? (
              filterMessages(messages, activeTab).map(message => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onMarkAsRead={markAsRead}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">chat</span>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'all' ? 'No messages found' : 
                   activeTab === 'unread' ? 'No unread messages' : 'No read messages'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerMessagesPage;