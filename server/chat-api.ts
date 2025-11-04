import express from 'express'
import { requireAuth } from './middleware.js'
import { PrismaClient } from '@prisma/client'
import { AuthUser } from './auth.js'

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthUser
    }
  }
}

const router = express.Router()
const prisma = new PrismaClient()

// Get user's chats with pagination and unread counts
router.get('/chats', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const userId = req.currentUser?.id
    const userRole = req.currentUser?.role

    // Get chats where user is participant
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId },
          { ownerId: userId }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message
          include: {
            files: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                recipientId: userId,
                readAt: null
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    })

    // Transform data for frontend
    const transformedChats = chats.map(chat => {
      const otherParticipant = chat.userId === userId ? chat.owner : chat.user
      const latestMessage = chat.messages[0]

      return {
        id: chat.id,
        participant: {
          id: otherParticipant.id,
          name: otherParticipant.name,
          email: otherParticipant.email,
          role: chat.userId === userId ? 'OWNER' : 'TENANT'
        },
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          senderId: latestMessage.senderId,
          senderName: latestMessage.senderId === userId ? req.currentUser!.name : otherParticipant.name,
          createdAt: latestMessage.createdAt,
          hasAttachments: latestMessage.files.length > 0
        } : null,
        unreadCount: chat._count.messages,
        createdAt: chat.createdAt
      }
    })

    // Get total count for pagination
    const totalChats = await prisma.chat.count({
      where: {
        OR: [
          { userId },
          { ownerId: userId }
        ]
      }
    })

    res.json({
      success: true,
      data: transformedChats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalChats,
        totalPages: Math.ceil(totalChats / Number(limit))
      }
    })

  } catch (error) {
    console.error('Error fetching chats:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_CHATS_FAILED', message: 'Failed to fetch chats' }
    })
  }
})

// Get messages for a specific chat with pagination
router.get('/chats/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params
    const { cursor, limit = 20 } = req.query

    const userId = req.currentUser!.id

    // Verify user has access to this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true, ownerId: true }
    })

    if (!chat || (chat.userId !== userId && chat.ownerId !== userId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'CHAT_ACCESS_DENIED', message: 'Access denied to this chat' }
      })
    }

    // Build where clause
    const take = Number(limit)

    const messages = await prisma.message.findMany({
      where: { chatId },
      take: take + 1, // Fetch one extra to determine if there are more pages
      cursor: cursor ? { id: cursor as string } : undefined,
      include: {
        files: true
      },
      orderBy: { createdAt: 'desc' },
    })

    let hasMore = false;
    let nextCursor: string | null = null;

    if (messages.length > take) {
      hasMore = true;
      const nextMessage = messages.pop(); // Remove the extra item
      nextCursor = nextMessage!.id;
    }

    // Mark messages as read if user is recipient
    const unreadMessageIds = messages
      .filter(msg => msg.recipientId === userId && !msg.readAt)
      .map(msg => msg.id)

    if (unreadMessageIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadMessageIds } },
        data: { readAt: new Date() }
      })
    }

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        nextCursor,
        hasMore,
      },
      pagination: {
      }
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_MESSAGES_FAILED', message: 'Failed to fetch messages' }
    })
  }
})

// Send a message via REST API (fallback for when WebSocket fails)
router.post('/chats/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params
    const { content, propertyId, attachments } = req.body
    const userId = req.currentUser!.id

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Message content is required' }
      })
    }

    // Verify user has access to this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { user: true, owner: true }
    })

    if (!chat || (chat.userId !== userId && chat.ownerId !== userId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'CHAT_ACCESS_DENIED', message: 'Access denied to this chat' }
      })
    }

    // Determine recipient
    const recipientId = chat.userId === userId ? chat.ownerId : chat.userId

    // Use transaction to ensure message and files are saved atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.message.create({
        data: {
          chatId,
          senderId: userId,
          recipientId,
          content: content.trim(),
          senderType: req.currentUser!.role
        }
      })

      // Create file attachments if any
      if (attachments && Array.isArray(attachments)) {
        await tx.file.createMany({
          data: attachments.map((attachment: any) => ({
            messageId: message.id,
            url: attachment.url,
            fileName: attachment.fileName || 'attachment',
            fileType: attachment.fileType || attachment.type,
            userId: userId
          }))
        })
      }

      // Get complete message with files
      return await tx.message.findUnique({
        where: { id: message.id },
        include: {
          files: true
        }
      })
    })

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    res.status(201).json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({
      success: false,
      error: { code: 'SEND_MESSAGE_FAILED', message: 'Failed to send message' }
    })
  }
})

// Start a new chat
router.post('/chats', requireAuth, async (req, res) => {
  try {
    const { recipientId, propertyId, initialMessage } = req.body
    const userId = req.currentUser!.id

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: { code: 'RECIPIENT_REQUIRED', message: 'Recipient ID is required' }
      })
    }

    // Check if chat already exists
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId, ownerId: recipientId },
          { userId: recipientId, ownerId: userId }
        ]
      }
    })

    if (!chat) {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userId: req.currentUser?.role === 'TENANT' ? userId : recipientId,
          ownerId: req.currentUser?.role === 'OWNER' ? userId : recipientId
        }
      })
    }

    // Send initial message if provided
    let message = null
    if (initialMessage) {
      message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          recipientId,
          content: initialMessage,
          senderType: req.currentUser!.role
        },
        include: {
          files: true
        }
      })
    }

    res.status(201).json({
      success: true,
      data: {
        chat,
        initialMessage: message
      }
    })

  } catch (error) {
    console.error('Error creating chat:', error)
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_CHAT_FAILED', message: 'Failed to create chat' }
    })
  }
})

// Mark messages as read
router.post('/chats/:chatId/read', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params
    const { messageIds } = req.body
    const userId = req.currentUser!.id

    if (!Array.isArray(messageIds)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'messageIds must be an array.' } });
    }

    // Verify user has access to this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true, ownerId: true }
    })

    if (!chat || (chat.userId !== userId && chat.ownerId !== userId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'CHAT_ACCESS_DENIED', message: 'Access denied to this chat' }
      })
    }

    // Mark messages as read
    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId,
        readAt: null
      },
      data: { readAt: new Date() }
    })

    res.json({ success: true, data: { updatedCount: result.count } });

  } catch (error) {
    console.error('Error marking messages read:', error);
    res.status(500).json({ success: false, error: { code: 'MARK_READ_FAILED', message: 'Failed to mark messages as read' } });
  }
});

export default router
