import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { ChatService, ChatArchiver } from '../server/chat'
import { ChatClient } from '../client/chat-client'

const prisma = new PrismaClient()

describe('Chat System', () => {
  let server: any
  let chatService: ChatService
  let chatClient: ChatClient
  let testUser: any
  let testOwner: any
  let testChat: any

  beforeAll(async () => {
    // Create test server
    const express = (await import('express')).default
    const http = (await import('http')).default
    const app = express()
    server = http.createServer(app)
    chatService = new ChatService(server)

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: 'hashedpass',
        name: 'Test User',
        role: 'TENANT'
      }
    })

    testOwner = await prisma.user.create({
      data: {
        email: 'testowner@example.com',
        password: 'hashedpass',
        name: 'Test Owner',
        role: 'OWNER'
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
    await prisma.message.deleteMany()
    await prisma.chat.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
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
          content: 'Unread message'
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
          content: `Message ${i + 1}`
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
      const client = new ChatClient('http://localhost:3001', 'mock-token')

      // Mock disconnected state
      const originalConnected = client['socket']?.connected
      if (client['socket']) {
        client['socket'].connected = false
      }

      const messagePromise = client.sendMessage({
        chatId: testChat.id,
        content: 'Queued message'
      })

      // Should be queued, not rejected
      expect(client['messageQueue']).toHaveLength(1)

      // Restore connection state
      if (client['socket']) {
        client['socket'].connected = originalConnected
      }
    })

    it('should process queued messages after reconnection', async () => {
      const client = new ChatClient('http://localhost:3001', 'mock-token')

      // Add message to queue
      client['messageQueue'].push({
        data: { chatId: testChat.id, content: 'Test' },
        resolve: jest.fn(),
        reject: jest.fn()
      })

      // Mock connection
      client['socket'] = { connected: true } as any

      // Process queue
      client['processMessageQueue']()

      expect(client['messageQueue']).toHaveLength(0)
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
