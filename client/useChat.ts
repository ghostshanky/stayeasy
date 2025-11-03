import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import apiClient from '../api/apiClient'; // Assuming you have a central axios instance

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string;
  sender: { id: string; name: string; role: string };
  // ... other fields
}

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextCursor = useRef<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);

  const fetchHistory = useCallback(async (cursor: string | null) => {
    if (!chatId || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/chats/${chatId}/messages`, {
        params: { cursor, limit: 20 },
      });
      const { messages: newMessages, nextCursor: newNextCursor, hasMore: newHasMore } = response.data.data;
      
      setMessages(prev => [...newMessages, ...prev]);
      nextCursor.current = newNextCursor;
      setHasMore(newHasMore);

    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, hasMore]);

  useEffect(() => {
    if (!chatId) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error("No auth token found for chat connection.");
      return;
    }

    const socket = io(SERVER_URL, {
      auth: { token },
      reconnection: false, // We handle reconnection manually
    });
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('Chat connected:', socket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      socket.emit('join_chat', chatId);
      // Fetch any messages missed while disconnected
      if (messages.length > 0) {
        const lastMessageDate = messages[messages.length - 1].createdAt;
        // You could implement a `fetchSince` endpoint or just refetch
      } else {
        fetchHistory(null);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log('Chat disconnected:', reason);
      setIsConnected(false);
      if (reason !== 'io client disconnect') {
        handleReconnect();
      }
    };

    const handleReconnect = () => {
      if (reconnectAttempts.current < 5) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        console.log(`Attempting to reconnect in ${delay / 1000}s...`);
        setTimeout(() => {
          reconnectAttempts.current++;
          socket.connect();
        }, delay);
      } else {
        console.error("Max reconnection attempts reached.");
      }
    };

    const handleNewMessage = (newMessage: ChatMessage) => {
      // Avoid adding duplicates from ACK
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    };

    const handleMessageSent = (ackMessage: ChatMessage & { tempId: string }) => {
      // Update the temporary message with the real one from the server
      setMessages(prev => prev.map(msg => msg.id === ackMessage.tempId ? { ...ackMessage, id: ackMessage.id } : msg));
    };

    const handleMessageError = ({ error, originalMessage }: { error: string, originalMessage: any }) => {
      console.error(`Failed to send message: ${error}`);
      // Mark the message as failed in the UI
      setMessages(prev => prev.map(msg => msg.id === originalMessage.tempId ? { ...msg, status: 'failed' } : msg));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_error', handleMessageError);

    socket.connect();

    return () => {
      console.log('Cleaning up chat socket.');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_error', handleMessageError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId, fetchHistory]);

  const sendMessage = (content: string, attachments?: any[]) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("Socket not connected. Cannot send message.");
      // Optionally, queue the message
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const tempMessage: any = {
      id: tempId,
      chatId,
      senderId: 'current_user_id', // Replace with actual user ID from context
      content,
      createdAt: new Date().toISOString(),
      status: 'pending', // UI state
      sender: { name: 'Me' }, // Placeholder
    };

    // Optimistically update the UI
    setMessages(prev => [...prev, tempMessage]);

    socketRef.current.emit('send_message', {
      chatId,
      content,
      attachments,
      tempId,
    });
  };

  const loadMoreMessages = () => {
    if (!isLoading && hasMore) {
      fetchHistory(nextCursor.current);
    }
  };

  return { messages, isConnected, isLoading, hasMore, sendMessage, loadMoreMessages };
}