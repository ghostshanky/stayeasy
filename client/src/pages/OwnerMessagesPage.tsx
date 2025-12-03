import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Fetch messages from the new inbox endpoint
      // We can pass status filter to the API if we want, but for now let's fetch all and filter client side
      // or we can optimize by passing status query param
      let endpoint = '/messages/inbox';
      if (activeTab === 'unread') endpoint += '?status=unread';
      if (activeTab === 'read') endpoint += '?status=read';

      const response = await apiClient.get(endpoint);

      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        console.error('Failed to fetch messages:', response.error);
        // Fallback to empty list
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await apiClient.put('/api/messages/read', {
        messageIds: [messageId]
      });

      if (response.success) {
        // Update local state
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        ));
      } else {
        console.error('Failed to mark message as read:', response.error);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getUnreadCount = () => {
    // This might be inaccurate if we only fetched read messages, but for 'all' tab it works.
    // Ideally we should fetch unread count separately or from the API meta.
    // For now, let's just count from current messages if activeTab is 'all' or 'unread'.
    if (activeTab === 'read') return 0; // We don't have unread messages in this view
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
          <OwnerHeader userName={user?.name || 'Owner'} />

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
              Unread
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
            {messages.length > 0 ? (
              messages.map(message => (
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