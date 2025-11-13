import express from 'express';
import { requireAuth } from '../middleware.js';
import { PrismaClient } from '@prisma/client';
import { AuthUser } from '../auth.js';
import { supabaseServer } from '../lib/supabaseServer.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthUser
    }
  }
}

const router = express.Router();
const prisma = new PrismaClient();

// Get user's conversations with pagination
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.currentUser!.id;

    // Get all messages for this user using Supabase
    const { data: messages, error } = await supabaseServer
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, email, image_id),
        recipient:users!messages_recipient_id_fkey(id, name, email, image_id),
        chats!inner(id, properties(id, title, images))
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw error;
    }

    // Transform conversations data
    const conversationsMap = new Map();
    
    messages?.forEach((message: any) => {
      const otherUser = message.sender_id === userId ? message.recipient : message.sender;
      const property = message.chats?.properties;
      
      const conversationKey = message.sender_id === userId ?
        `${message.sender_id}_${message.recipient_id}` :
        `${message.recipient_id}_${message.sender_id}`;
      
      if (!conversationsMap.has(conversationKey)) {
        conversationsMap.set(conversationKey, {
          id: message.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            avatarUrl: otherUser.image_id ?
              `https://ik.imagekit.io/Shanky/profiles/${otherUser.image_id}.png` :
              '/images/default-avatar.png'
          },
          property: property ? {
            id: property.id,
            title: property.title,
            image: property.images?.[0] || null
          } : null,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.sender_id,
            createdAt: message.created_at,
            readAt: message.read_at
          },
          unreadCount: 0,
          createdAt: message.created_at
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Get unread counts
    const { data: unreadData } = await supabaseServer
      .from('messages')
      .select('recipient_id, id')
      .eq('recipient_id', userId)
      .is('read_at', null);

    const unreadCounts = unreadData?.reduce((acc: any, msg: any) => {
      const senderId = msg.recipient_id === userId ? msg.sender_id : msg.recipient_id;
      acc[senderId] = (acc[senderId] || 0) + 1;
      return acc;
    }, {}) || {};

    // Add unread counts to conversations
    const finalConversations = conversations.map((conv: any) => ({
      ...conv,
      unreadCount: unreadCounts[conv.otherUser.id] || 0
    }));

    res.json({
      success: true,
      data: finalConversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: conversations.length,
        totalPages: Math.ceil(conversations.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_CONVERSATIONS_FAILED', message: 'Failed to fetch conversations' }
    });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:userId', requireAuth, async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const currentUserId = req.currentUser!.id;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_ID_REQUIRED', message: 'User ID is required' }
      });
    }

    // Get messages between two users using Supabase
    let query = supabaseServer
      .from('messages')
      .select(`
        *,
        files(*)
      `)
      .or(`(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: false })
      .limit(Number(limit) + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    let hasMore = false;
    let nextCursor: string | null = null;

    if (messages && messages.length > Number(limit)) {
      hasMore = true;
      const nextMessage = messages.pop();
      nextCursor = nextMessage?.created_at;
    }

    // Mark messages as read for the current user
    const unreadMessages = messages?.filter(msg =>
      msg.recipient_id === currentUserId && !msg.read_at
    ) || [];

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(msg => msg.id);
      await supabaseServer
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    // Get other user's info
    const { data: otherUser } = await supabaseServer
      .from('users')
      .select('id, name, email, image_id')
      .eq('id', otherUserId)
      .single();

    res.json({
      success: true,
      data: {
        messages: messages?.reverse() || [], // Return in chronological order
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatarUrl: otherUser.image_id ?
            `https://ik.imagekit.io/Shanky/profiles/${otherUser.image_id}.png` :
            '/images/default-avatar.png'
        } : null,
        nextCursor,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_CONVERSATION_FAILED', message: 'Failed to fetch conversation' }
    });
  }
});

// Send a new message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { recipientId, content, propertyId } = req.body;
    const senderId = req.currentUser!.id;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Recipient ID and content are required' }
      });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: { code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found' }
      });
    }

    // Create message using the existing chat system
    const { data: message, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
        read_at: null
      })
      .select()
      .single();

    if (messageError || !message) {
      return res.status(500).json({
        success: false,
        error: { code: 'SEND_MESSAGE_FAILED', message: 'Failed to send message' }
      });
    }

    // Update conversation timestamps
    // Update conversation timestamps (simplified approach)
    // In a real implementation, you'd have a conversations table
    // For now, we'll just log this action
    console.log(`Conversation updated between ${senderId} and ${recipientId}`);

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEND_MESSAGE_FAILED', message: 'Failed to send message' }
    });
  }
});

// Mark messages as read
router.put('/read', requireAuth, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.currentUser!.id;

    if (!Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'messageIds must be an array' }
      });
    }

    const { error } = await supabaseServer
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('recipient_id', userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'MARK_READ_FAILED', message: 'Failed to mark messages as read' }
      });
    }

    res.json({
      success: true,
      data: { updatedCount: messageIds.length }
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MARK_READ_FAILED', message: 'Failed to mark messages as read' }
    });
  }
});

// Get online status of users
router.get('/online-status', requireAuth, async (req, res) => {
  try {
    const { userIds } = req.query;
    
    if (!userIds || typeof userIds !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_IDS_REQUIRED', message: 'User IDs are required' }
      });
    }

    const userIdArray = userIds.split(',');
    
    // In a real implementation, you'd check against an online users table or cache
    // For now, return all users as offline
    const onlineUsers = userIdArray.map(id => ({
      userId: id,
      isOnline: false,
      lastSeen: null
    }));

    res.json({
      success: true,
      data: onlineUsers
    });

  } catch (error) {
    console.error('Error fetching online status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ONLINE_STATUS_FAILED', message: 'Failed to fetch online status' }
    });
  }
});

export default router;