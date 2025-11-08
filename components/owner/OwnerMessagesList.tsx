import React, { useState } from 'react';
import { useOwnerMessages } from '../../client/src/hooks/useOwnerMessages';
import { supabase } from '../../client/src/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  content: string;
  read: boolean;
  created_at: string;
  sender: {
    name: string;
    email: string;
  };
  property?: {
    name: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  }
};

const OwnerMessagesList: React.FC = () => {
  const { items: messages, loading, error } = useOwnerMessages(20, 1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      // Refresh the messages list
      window.location.reload();
    } catch (err) {
      console.error('Error marking message as read:', err);
      alert('Failed to mark message as read. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Messages List */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${selectedMessage ? 'md:w-1/3' : 'w-full'}`}>
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">Messages</h2>
        
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-text-light-secondary dark:text-text-dark-secondary mb-4">
              chat
            </span>
            <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              No messages yet
            </h3>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              When guests contact you about your properties, their messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedMessage?.id === message.id 
                    ? 'bg-primary/10 border border-primary' 
                    : message.read 
                      ? 'bg-background-light dark:bg-background-dark hover:bg-background-light/50 dark:hover:bg-background-dark/50' 
                      : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                      {message.sender.name}
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary truncate max-w-xs">
                      {message.property?.name || 'General inquiry'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {formatDate(message.created_at)}
                    </span>
                    {!message.read && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail */}
      {selectedMessage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:w-2/3">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {selectedMessage.sender.name}
              </h2>
              <p className="text-text-light-secondary dark:text-text-dark-secondary">
                {selectedMessage.sender.email}
              </p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                Regarding: {selectedMessage.property?.name || 'General inquiry'}
              </p>
            </div>
            <button 
              onClick={() => setSelectedMessage(null)}
              className="p-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="bg-background-light dark:bg-background-dark rounded-lg p-4 mb-6">
            <p className="text-text-light-primary dark:text-text-dark-primary whitespace-pre-wrap">
              {selectedMessage.content}
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-4">
              Sent on {new Date(selectedMessage.created_at).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex gap-3">
            {!selectedMessage.read && (
              <button
                onClick={() => markAsRead(selectedMessage.id)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Mark as Read
              </button>
            )}
            <button className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMessagesList;