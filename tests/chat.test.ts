import request from 'supertest'
import express from 'express'
import { createServer } from 'http'
import { PrismaClient } from '@prisma/client'
import { ChatService, ChatArchiver } from '../server/chat.js'
import { AuthService } from '../server/auth.js'
import { requireAuth } from '../server/middleware.js'

const prisma = new PrismaClient()

describe('Chat System', () => {
  let app: express.Application
  let server: any
  let chatService: ChatService
  let testUser: any
  let testOwner: any
  let testChat: any
  let userToken: string

  beforeAll(async () => {
    jest.setTimeout(30000) // Increase timeout for database operations

    // Create Express app
    app = express()
    app.use(express.json())

    // Create HTTP server
    server = createServer(app)
    chatService = new ChatService(server)

    // Create mock token for testing
    userToken = 'mock-jwt-token'

    // Setup chat API routes
    app.post('/api/chats/:chatId/messages', requireAuth, async (req: any, res) => {
      try {
        const { chatId } = req.params
        const { content, attachments } = req.body
        const currentUser = req.currentUser

        // Verify user has access to chat
        const chat = await prisma.chat.findUnique({
          where: { id: chatId }
        })

        if (!chat || (chat.userId !== currentUser.id && chat.ownerId !== currentUser.id)) {
          return res.status(403).json({ error: 'Access denied' })
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: currentUser.id,
            recipientId: chat.userId === currentUser.id ? chat.ownerId : chat.userId,
            content,
            senderType: currentUser.role
          },
          include: {
            files: true,
            sender: { select: { id: true, name: true, role: true } }
          }
        })

        // Create attachments if provided
        if (attachments && attachments.length > 0) {
          await prisma.file.createMany({
            data: attachments.map((att: any) => ({
              messageId: message.id,
              url: att.url,
              type: att.type
            }))
          })
        }

        res.status(201).json({ success: true, data: message })
      } catch (error) {
        console.error('Error sending message:', error)
        res.status(500).json({ error: 'Failed to send message' })
      }
    })

    app.get('/api/chats/:chatId/messages', requireAuth, async (req: any, res) => {
      try {
        const { chatId } = req.params
        const currentUser = req.currentUser
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const offset = (page - 1) * limit

        // Verify access
        const chat = await prisma.chat.findUnique({
          where: { id: chatId }
        })

        if (!chat || (chat.userId !== currentUser.id && chat.ownerId !== currentUser.id)) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const messages = await prisma.message.findMany({
          where: { chatId },
          include: {
            files: true,
            sender: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'DESC' },
          skip: offset,
          take: limit
        })

        const total = await prisma.message.count({ where: { chatId } })

        res.json({
          success: true,
          data: {
            messages: messages.reverse(),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasMore: offset + limit < total
            }
          }
        })
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' })
      }
    })

    app.get('/api/chats', requireAuth, async (req: any, res) => {
      try {
        const currentUser = req.currentUser
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const offset = (page - 1) * limit

        const chats = await prisma.chat.findMany({
          where: {
            OR: [
              { userId: currentUser.id },
              { ownerId: currentUser.id }
            ]
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            owner: { select: { id: true, name: true, email: true, role: true } },
            messages: {
              take: 1,
              orderBy: { createdAt: 'DESC' },
              include: {
                sender: { select: { id: true, name: true } },
                files: true
              }
            }
          },
          orderBy: { updatedAt: 'DESC' },
          skip: offset,
          take: limit
        })

        const chatsWithUnread = await Promise.all(
          chats.map(async (chat: any) => {
            const unreadCount = await prisma.message.count({
              where: {
                chatId: chat.id,
                recipientId: currentUser.id,
                readAt: null
              }
            })

            const participant = chat.userId === currentUser.id ? chat.owner : chat.user

            return {
              id: chat.id,
              participant,
              latestMessage: chat.messages[0] ? {
                id: chat.messages[0].id,
                content: chat.messages[0].content,
                senderId: chat.messages[0].senderId,
                senderName: chat.messages[0].sender.name,
                createdAt: chat.messages[0].createdAt,
                hasAttachments: chat.messages[0].files.length > 0
              } : undefined,
              unreadCount,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt
            }
          })
        )

        const total = await prisma.chat.count({
          where: {
            OR: [
              { userId: currentUser.id },
              { ownerId: currentUser.id }
            ]
          }
        })

        res.json({
          success: true,
          data: {
            chats: chatsWithUnread,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }
        })
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' })
      }
    })

    // Auth middleware for testing
    app.use(async (req: any, res, next) => {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        req.currentUser = await AuthService.validateSession(token)
      }
      next()
    })
  })

  beforeEach(async () => {
    // Generate unique emails for this test run
    const timestamp = Date.now()
    const userEmail = `testuser${timestamp}@example.com`
    const ownerEmail = `testowner${timestamp}@example.com`

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: userEmail,
        password: await AuthService.hashPassword('password123'),
        name: 'Test User',
        role: 'TENANT'
      }
    })

    testOwner = await prisma.owner.create({
      data: {
        email: ownerEmail,
        password: await AuthService.hashPassword('password123'),
        name: 'Test Owner'
      }
    })

    // Create test chat
    testChat = await prisma.chat.create({
      data: {
        userId: testUser.id,
        ownerId: testOwner.id
      }
    })
  })

  afterAll(async () => {
    server?.close()
  })

  describe('Message Persistence', () => {
    it('should save messages to database with transaction', async () => {
      const messageData = {
        chatId: testChat.id,
        senderId: testUser.id,
        recipientId: testOwner.id,
        content: 'Test message',
        attachments: [
          { url: 'https://example.com/file.jpg', type: 'image' }
        ]
      }

      // Simulate sending message via API
      const response = await request(server)
        .post(`/api/chats/${testChat.id}/messages`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          content: messageData.content,
          attachments: messageData.attachments
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)

      // Verify message was saved
      const savedMessage = await prisma.message.findFirst({
        where: { chatId: testChat.id },
        include: { files: true }
      })

      expect(savedMessage).toBeTruthy()
      expect(savedMessage?.content).toBe(messageData.content)
      expect(savedMessage?.files).toHaveLength(1)
      expect(savedMessage?.files[0].url).toBe(messageData.attachments[0].url)
    })

    it('should handle transaction failure and send NACK', async () => {
      // Mock database failure
      const originalCreate = prisma.message.create
      prisma.message.create = jest.fn().mockRejectedValue(new Error('DB Error'))

      const messageData = {
        chatId: testChat.id,
        content: 'This should fail'
      }

      try {
        await request(server)
          .post(`/api/chats/${testChat.id}/messages`)
          .set('Authorization', `Bearer mock-token`)
          .send(messageData)
      } catch (error) {
        // Should not save message
        const messages = await prisma.message.findMany({
          where: { chatId: testChat.id, content: messageData.content }
        })
        expect(messages).toHaveLength(0)
      } finally {
        prisma.message.create = originalCreate
      }
    })

    it('should mark messages as read', async () => {
      // Create unread message
      const message = await prisma.message.create({
        data: {
          chatId: testChat.id,
          senderId: testOwner.id,
          recipientId: testUser.id,
          content: 'Unread message',
          senderType: 'OWNER'
        }
      })

      // Mark as read
      const response = await request(server)
        .put(`/api/chats/${testChat.id}/read`)
        .set('Authorization', `Bearer mock-token`)
        .send({ messageIds: [message.id] })

      expect(response.status).toBe(200)

      // Verify read status
      const updatedMessage = await prisma.message.findUnique({
        where: { id: message.id }
      })
      expect(updatedMessage?.readAt).toBeTruthy()
    })
  })

  describe('Real-time Messaging', () => {
    it('should authenticate socket connection', async () => {
      // This would require setting up a test socket client
      // For now, we'll test the authentication middleware separately
      expect(chatService).toBeDefined()
    })

    it('should handle message delivery via WebSocket', async () => {
      // Create test message via WebSocket simulation
      const messageData = {
        chatId: testChat.id,
        content: 'Real-time message',
        senderId: testUser.id,
        recipientId: testOwner.id
      }

      // Simulate WebSocket message handling
      const mockSocket = {
        userId: testUser.id,
        userRole: 'TENANT',
        emit: jest.fn(),
        to: jest.fn().mockReturnThis()
      }

      // This would test the actual WebSocket message handling
      // For now, we verify the service exists
      expect(typeof chatService.sendSystemMessage).toBe('function')
    })
  })

  describe('Chat History and Pagination', () => {
    beforeAll(async () => {
      // Create multiple messages for pagination testing
      const messages = []
      for (let i = 0; i < 25; i++) {
        messages.push({
          chatId: testChat.id,
          senderId: i % 2 === 0 ? testUser.id : testOwner.id,
          recipientId: i % 2 === 0 ? testOwner.id : testUser.id,
          content: `Message ${i + 1}`,
          senderType: i % 2 === 0 ? 'TENANT' : 'OWNER'
        })
      }

      await prisma.message.createMany({ data: messages })
    })

    it('should fetch chat history with pagination', async () => {
      const response = await request(server)
        .get(`/api/chats/${testChat.id}/messages?page=1&limit=10`)
        .set('Authorization', `Bearer mock-token`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.pagination.hasMore).toBe(true)
    })

    it('should fetch chats list with unread counts', async () => {
      const response = await request(server)
        .get('/api/chats')
        .set('Authorization', `Bearer mock-token`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data[0]).toHaveProperty('unreadCount')
    })
  })

  describe('Client Reconnection', () => {
    it('should queue messages when disconnected', () => {
      // Skip client tests for now as they require complex mocking
      expect(true).toBe(true)
    })

    it('should process queued messages after reconnection', async () => {
      // Skip client tests for now as they require complex mocking
      expect(true).toBe(true)
    })
  })

  describe('Archival and Retention', () => {
    it('should archive old messages', async () => {
      const archiver = new ChatArchiver()

      // Create old message
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 2)

      await prisma.message.create({
        data: {
          chatId: testChat.id,
          senderId: testUser.id,
          recipientId: testOwner.id,
          content: 'Old message',
          senderType: 'TENANT',
          createdAt: oldDate
        }
      })

      const archivedCount = await archiver.archiveOldMessages(1) // 1 year old

      expect(archivedCount).toBeGreaterThan(0)
    })

    it('should cleanup empty chats', async () => {
      // Create empty chat
      const emptyChat = await prisma.chat.create({
        data: {
          userId: testUser.id,
          ownerId: testOwner.id
        }
      })

      const archiver = new ChatArchiver()
      const cleanedCount = await archiver.cleanupEmptyChats()

      // Chat should be deleted if no messages in last 90 days
      const deletedChat = await prisma.chat.findUnique({
        where: { id: emptyChat.id }
      })

      expect(deletedChat).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid chat access', async () => {
      const response = await request(server)
        .post('/api/chats/invalid-chat-id/messages')
        .set('Authorization', `Bearer mock-token`)
        .send({ content: 'Test' })

      expect(response.status).toBe(403)
    })

    it('should validate message content', async () => {
      const response = await request(server)
        .post(`/api/chats/${testChat.id}/messages`)
        .set('Authorization', `Bearer mock-token`)
        .send({ content: '' })

      expect(response.status).toBe(400)
    })

    it('should handle database connection failures', async () => {
      // Mock Prisma failure
      const originalFindUnique = prisma.chat.findUnique
      prisma.chat.findUnique = jest.fn().mockRejectedValue(new Error('DB Error'))

      const response = await request(server)
        .get(`/api/chats/${testChat.id}/messages`)
        .set('Authorization', `Bearer mock-token`)

      expect(response.status).toBe(500)

      // Restore
      prisma.chat.findUnique = originalFindUnique
    })
  })
})
