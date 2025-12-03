import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware.js';
import { PrismaClient } from '@prisma/client';
import { AuthUser } from '../auth.js';
import { AuditLogger } from '../audit-logger.js';

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
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!.id;

    // Get chats where user is participant
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId: userId },
          { ownerId: userId }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true, imageId: true } },
        owner: { select: { id: true, name: true, email: true, imageId: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Get unread counts
    const unreadCounts = await prisma.message.groupBy({
      by: ['chatId'],
      where: {
        recipientId: userId,
        readAt: null
      },
      _count: {
        id: true
      }
    });

    const unreadMap = new Map(unreadCounts.map(u => [u.chatId, u._count.id]));

    const conversations = chats.map(chat => {
      const otherUser = chat.userId === userId ? chat.owner : chat.user;
      const lastMessage = chat.messages[0];

      if (!lastMessage) return null; // Skip empty chats

      return {
        id: chat.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatarUrl: otherUser.imageId ?
            `https://ik.imagekit.io/Shanky/profiles/${otherUser.imageId}.png` :
            '/images/default-avatar.png'
        },
        property: null,
        lastMessage: {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          readAt: lastMessage.readAt
        },
        unreadCount: unreadMap.get(chat.id) || 0,
        createdAt: lastMessage.createdAt
      };
    }).filter(Boolean)
      .sort((a: any, b: any) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page: 1,
        limit: conversations.length,
        total: conversations.length,
        totalPages: 1
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
router.get('/conversation/:userId', requireAuth, async (req: Request, res: Response) => {
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

    // Find chat
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId: currentUserId, ownerId: otherUserId },
          { userId: otherUserId, ownerId: currentUserId }
        ]
      }
    });

    let messages: any[] = [];
    let nextCursor: string | null = null;
    let hasMore = false;

    if (chat) {
      const whereClause: any = { chatId: chat.id };
      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor as string) };
      }

      messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: Number(limit) + 1
      });

      if (messages.length > Number(limit)) {
        hasMore = true;
        const nextMessage = messages.pop();
        nextCursor = nextMessage?.createdAt.toISOString();
      }
    }

    // Mark messages as read
    if (messages.length > 0) {
      const unreadIds = messages
        .filter((msg: any) => msg.recipientId === currentUserId && !msg.readAt)
        .map((msg: any) => msg.id);

      if (unreadIds.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: unreadIds } },
          data: { readAt: new Date() }
        });
      }
    }

    // Get other user's info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true, imageId: true }
    });

    // Transform messages to match frontend expectation
    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.senderId,
      recipient_id: msg.recipientId,
      created_at: msg.createdAt,
      read_at: msg.readAt,
      files: [] // Attachments not handled in Prisma yet
    })).reverse();

    res.json({
      success: true,
      data: {
        messages: transformedMessages,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatarUrl: otherUser.imageId ?
            `https://ik.imagekit.io/Shanky/profiles/${otherUser.imageId}.png` :
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
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('POST /messages request body:', req.body);
    let { recipientId, content } = req.body;
    const senderId = req.currentUser!.id;
    console.log('Sender ID:', senderId);

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Recipient ID and content are required' }
      });
    }

    // Check if recipientId is an email
    if (recipientId.includes('@')) {
      console.log('Looking up recipient by email:', recipientId);
      const recipientUser = await prisma.user.findUnique({
        where: { email: recipientId },
        select: { id: true }
      });

      if (!recipientUser) {
        console.log('Recipient not found by email');
        return res.status(404).json({
          success: false,
          error: { code: 'RECIPIENT_NOT_FOUND', message: 'User with this email not found' }
        });
      }
      recipientId = recipientUser.id;
      console.log('Resolved recipient ID:', recipientId);
    }

    // Check if recipient exists (if it was an ID)
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      console.log('Recipient not found by ID:', recipientId);
      return res.status(404).json({
        success: false,
        error: { code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found' }
      });
    }

    // Find existing chat or create new one
    console.log('Finding/creating chat between', senderId, 'and', recipientId);
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId: senderId, ownerId: recipientId },
          { userId: recipientId, ownerId: senderId }
        ]
      }
    });

    if (!chat) {
      console.log('Creating new chat');
      chat = await prisma.chat.create({
        data: {
          userId: senderId,
          ownerId: recipientId
        }
      });
    }
    console.log('Chat ID:', chat.id);

    // Create message using Prisma
    console.log('Inserting message using Prisma');
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: senderId,
        recipientId: recipientId,
        content: content.trim(),
        readAt: null
      }
    });

    console.log('Message sent successfully:', message.id);

    // Log audit event
    try {
      await AuditLogger.logUserAction(senderId, 'MESSAGE_SENT', `Message sent to ${recipientId}`);
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    res.status(201).json({
      success: true,
      data: {
        ...message,
        // Map fields to match frontend expectation if needed
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        created_at: message.createdAt,
        read_at: message.readAt
      }
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
router.put('/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { messageIds } = req.body;
    const userId = req.currentUser!.id;

    if (!Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'messageIds must be an array' }
      });
    }

    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId
      },
      data: { readAt: new Date() }
    });

    res.json({
      success: true,
      data: { updatedCount: result.count }
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
router.get('/online-status', requireAuth, async (req: Request, res: Response) => {
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

// Get all messages received by the user (Inbox)
router.get('/inbox', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.currentUser!.id;

    const whereClause: any = { recipientId: userId };
    if (status === 'unread') {
      whereClause.readAt = null;
    } else if (status === 'read') {
      whereClause.readAt = { not: null };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    // Transform data to match frontend expectation
    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender,
      receiver: msg.recipient,
      property: null,
      created_at: msg.createdAt,
      read: !!msg.readAt
    }));

    res.json({
      success: true,
      data: transformedMessages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: messages.length // Approximate
      }
    });

  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_INBOX_FAILED', message: 'Failed to fetch inbox messages' }
    });
  }
});

export default router;