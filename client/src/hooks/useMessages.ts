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

      const response = await apiClient.get('/api/messages/conversations');

      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        console.error('❌ [useMessages] Failed to fetch conversations:', response.error);
        setError(response.error?.message || 'Failed to fetch conversations');
        setConversations([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching conversations');
      setConversations([]);
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

      if (response.success && response.data) {
        setMessages(response.data.messages);
      } else {
        console.error('❌ [useMessages] Failed to fetch messages:', response.error);
        setError(response.error?.message || 'Failed to fetch messages');
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (recipientId: string, content: string, propertyId?: string) => {
    try {
      const response = await apiClient.post('/api/messages', {
        recipientId,
        content,
        propertyId
      });

      if (response.success && response.data) {
        // Refresh conversations to show the new message
        await fetchConversations();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to send message');
      }
    } catch (err: any) {
      throw new Error(err.message || 'An error occurred while sending message');
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      const response = await apiClient.put('/api/messages/read', { messageIds });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to mark messages as read');
      }

      // Update local state
      setMessages(prev => prev.map(msg =>
        messageIds.includes(msg.id)
          ? { ...msg, readAt: new Date().toISOString() }
          : msg
      ));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'An error occurred while marking messages as read');
    }
  };

  // Get all messages for the user
  const fetchAllMessages = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      // Using inbox endpoint which returns received messages.
      // Note: This might not include sent messages if the backend endpoint is strictly inbox.
      const response = await apiClient.get(`/messages/inbox?page=${page}&limit=${limit}`);

      if (response.success && response.data) {
        // Transform data if necessary, but apiClient response should be already usable
        // The backend returns { success: true, data: [...], pagination: {...} }
        // We need to match the expected return type of this function

        const transformedMessages = response.data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender?.id || msg.sender_id, // Handle both cases if backend varies
          recipientId: msg.receiver?.id || msg.recipient_id,
          content: msg.content,
          propertyId: msg.property_id,
          readAt: msg.read ? new Date().toISOString() : undefined, // backend returns boolean 'read'
          createdAt: msg.created_at,
          sender: msg.sender,
          recipient: msg.receiver,
          property: msg.property
        }));

        setMessages(transformedMessages);
        return {
          total: response.pagination?.total || transformedMessages.length,
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || limit
        };
      } else {
        console.error('❌ [useMessages] Failed to fetch all messages:', response.error);
        setError(response.error?.message || 'Failed to fetch messages');
        setMessages([]);
        return { total: 0, page, limit };
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching messages');
      return { total: 0, page, limit };
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