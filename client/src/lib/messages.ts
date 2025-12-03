import { apiClient } from "../api/apiClient";

export async function sendMessage({ from_id, to_id, property_id, content }: {
  from_id: string;
  to_id: string;
  property_id?: string;
  content: string;
}) {
  const response = await apiClient.post('/api/messages', {
    recipientId: to_id,
    content,
    propertyId: property_id
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to send message');
  }

  return response.data;
}

export async function getMessages(userId: string, otherUserId?: string) {
  if (otherUserId) {
    const response = await apiClient.get(`/messages/conversation/${otherUserId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch messages');
    }
    return response.data.messages;
  } else {
    // Fallback or different endpoint if needed. 
    // For now, let's use the inbox endpoint or similar if available, 
    // but the original function fetched ALL messages. 
    // We'll use the inbox endpoint which returns a list of messages.
    const response = await apiClient.get('/api/messages/inbox');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch messages');
    }
    return response.data;
  }
}

export async function markMessagesAsRead(messageIds: string[], userId: string) {
  const response = await apiClient.put('/api/messages/read', { messageIds });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to mark messages as read');
  }
}

export async function getConversations(userId: string) {
  const response = await apiClient.get('/api/messages/conversations');

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch conversations');
  }

  // Transform the response to match the expected format of the original function if necessary.
  // The original function returned an array of conversation objects.
  // The API returns: [{ id, otherUser, lastMessage, unreadCount, ... }]
  // The original function returned: [{ otherUserId, messages: [], lastMessage, unreadCount }]

  // We need to map the API response to the old format to maintain compatibility
  return response.data.map((conv: any) => ({
    otherUserId: conv.otherUser.id,
    messages: [], // API doesn't return full message history in conversation list
    lastMessage: {
      ...conv.lastMessage,
      sender_id: conv.lastMessage.senderId,
      recipient_id: conv.lastMessage.recipientId,
      created_at: conv.lastMessage.createdAt,
      read_at: conv.lastMessage.readAt
    },
    unreadCount: conv.unreadCount
  }));
}
