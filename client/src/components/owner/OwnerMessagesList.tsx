import React, { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  property?: {
    id: string;
    title: string;
    image?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    readAt?: string;
  };
  unreadCount: number;
  createdAt: string;
}

interface OwnerMessagesListProps {
  onConversationSelect: (conversationId: string) => void;
  selectedConversation: string | null;
}

const OwnerMessagesList: React.FC<OwnerMessagesListProps> = ({
  onConversationSelect,
  selectedConversation
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No conversations yet</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedConversation === conversation.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            onClick={() => onConversationSelect(conversation.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {conversation.otherUser.name.charAt(0)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {conversation.otherUser.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(conversation.lastMessage.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                  {conversation.property?.title || 'No property'}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {conversation.lastMessage.content}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OwnerMessagesList;