import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  propertyId?: string;
  readAt?: string;
  createdAt: string;
  sender?: { id: string; name: string; email: string; role: string };
  recipient?: { id: string; name: string; email: string; role: string };
  files?: Array<{
    id: string;
    url: string;
    fileName: string;
    fileType: string;
    createdAt: string;
  }>;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export function useMessages(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/messages/conversations?userId=${userId}`);
      
      if (response.data.success) {
        setConversations(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch conversations');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching conversations');
    } finally {
      setLoading(false);
    }
  };

  // Get messages between two users
  const fetchMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/messages/conversation/${otherUserId}`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch messages');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (recipientId: string, content: string, propertyId?: string) => {
    try {
      const response = await apiClient.post('/messages', {
        recipientId,
        content,
        propertyId,
      });

      if (response.data.success) {
        // Refresh conversations to show the new message
        await fetchConversations();
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to send message');
      }
    } catch (err: any) {
      throw new Error(err.message || 'An error occurred while sending message');
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      const response = await apiClient.put('/messages/read', {
        messageIds,
      });

      if (response.data.success) {
        // Update local state
        setMessages(prev => prev.map(msg =>
          messageIds.includes(msg.id)
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        ));
        return true;
      } else {
        throw new Error(response.data.error?.message || 'Failed to mark messages as read');
      }
    } catch (err: any) {
      throw new Error(err.message || 'An error occurred while marking messages as read');
    }
  };

  // Get all messages for the user
  const fetchAllMessages = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/messages?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
        return response.data.pagination;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch messages');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  // Set up polling for new messages (replaces real-time subscription)
  useEffect(() => {
    if (!userId) return;

    const pollForNewMessages = async () => {
      try {
        await fetchConversations();
      } catch (err) {
        console.error('Error polling for new messages:', err);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollForNewMessages, 30000);

    // Initial fetch
    pollForNewMessages();

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    fetchAllMessages
  };
}