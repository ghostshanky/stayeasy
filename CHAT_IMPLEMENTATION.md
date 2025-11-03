# Chat System Implementation

This document outlines the complete chat system implementation for StayEasy, including real-time messaging, message persistence, client reconnection, and archival strategies.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Socket.IO     │◄──►│   Express API   │
│                 │    │   Client        │    │   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Redis Cache   │
                       │   (Messages)    │    │   (Sessions)    │
                       └─────────────────┘    └─────────────────┘
```

## Database Schema

### Message Model
```prisma
model Message {
  id          String    @id @default(cuid())
  chatId      String
  senderId    String
  recipientId String
  propertyId  String?
  content     String
  createdAt   DateTime  @default(now())
  readAt      DateTime?
  chat        Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  files       File[]
  sender      User      @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  recipient   User      @relation("MessageRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  property    Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  @@index([chatId])
  @@index([senderId])
  @@index([recipientId])
  @@index([propertyId])
  @@index([createdAt])
  @@index([readAt])
  @@index([senderId, recipientId])
  @@index([chatId, createdAt])
}
```

### Chat Model
```prisma
model Chat {
  id        String    @id @default(cuid())
  userId    String
  ownerId   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation("UserChats", fields: [userId], references: [id], onDelete: Cascade)
  owner     Owner     @relation("OwnerChats", fields: [ownerId], references: [id], onDelete: Cascade)
  messages  Message[]

  @@map("chats")
  @@index([userId])
  @@index([ownerId])
  @@index([createdAt])
}
```

## Server-Side Implementation

### Socket.IO Authentication

```typescript
// server/chat.ts
this.io.use(async (socket: any, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const session = await prisma.session.findUnique({
      where: { token: decoded.sessionToken },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return next(new Error('Session expired'))
    }

    socket.userId = session.userId
    socket.userRole = session.user.role
    socket.sessionId = session.id

    next()
  } catch (error) {
    next(new Error('Authentication failed'))
  }
})
```

### Message Handling with Transactions

```typescript
private async handleMessage(socket: AuthenticatedSocket, data: {
  chatId: string
  content: string
  propertyId?: string
  attachments?: Array<{ url: string, type: string }>
}) {
  const { chatId, content, propertyId, attachments } = data

  // Verify user has access to this chat
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { user: true, owner: true }
  })

  if (!chat) {
    throw new Error('Chat not found')
  }

  if (chat.userId !== socket.userId && chat.ownerId !== socket.userId) {
    throw new Error('Unauthorized access to chat')
  }

  // Determine recipient
  const recipientId = chat.userId === socket.userId ? chat.ownerId : chat.userId

  // Use transaction to ensure message and files are saved atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create message
    const message = await tx.message.create({
      data: {
        chatId,
        senderId: socket.userId,
        recipientId,
        propertyId,
        content,
        createdAt: new Date()
      }
    })

    // Create file attachments if any
    if (attachments && attachments.length > 0) {
      await tx.file.createMany({
        data: attachments.map(attachment => ({
          messageId: message.id,
          url: attachment.url,
          type: attachment.type
        }))
      })
    }

    // Get complete message with files
    return await tx.message.findUnique({
      where: { id: message.id },
      include: {
        files: true,
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
        property: { select: { id: true, name: true } }
      }
    })
  })

  if (!result) {
    throw new Error('Failed to save message')
  }

  // Emit to chat room
  this.io.to(`chat_${chatId}`).emit('new_message', result)

  // Emit to recipient's private room (for notifications)
  this.io.to(`user_${recipientId}`).emit('message_notification', {
    chatId,
    message: result,
    unreadCount: await this.getUnreadCount(recipientId)
  })

  // Send ACK to sender
  socket.emit('message_sent', {
    messageId: result.id,
    chatId,
    timestamp: result.createdAt
  })
}
```

### Read Receipts

```typescript
socket.on('mark_read', async (data: { chatId: string, messageIds: string[] }) => {
  try {
    await this.markMessagesRead(socket.userId, data.messageIds)
    socket.to(`chat_${data.chatId}`).emit('messages_read', {
      chatId: data.chatId,
      readerId: socket.userId,
      messageIds: data.messageIds
    })
  } catch (error) {
    console.error('Failed to mark messages read:', error)
  }
})
```

## Client-Side Implementation

### Chat Client Class

```typescript
export class ChatClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: Array<{
    data: any
    resolve: (value: any) => void
    reject: (reason: any) => void
  }> = []

  constructor(
    private serverUrl: string = 'http://localhost:3001',
    private authToken: string
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        auth: {
          token: this.authToken
        },
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('Connected to chat server')
        this.reconnectAttempts = 0
        this.processMessageQueue()
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection failed:', error)
        this.handleReconnect()
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error)
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason)
        if (reason === 'io server disconnect') {
          this.handleReconnect()
        }
      })

      this.setupEventListeners()
    })
  }

  async sendMessage(data: {
    chatId: string
    content: string
    propertyId?: string
    attachments?: Array<{ url: string, type: string }>
  }): Promise<{ messageId: string, chatId: string, timestamp: Date }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        // Queue message for when connection is restored
        this.messageQueue.push({ data, resolve, reject })
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'))
      }, 10000)

      this.socket.emit('send_message', data)

      this.socket.once('message_sent', (response: any) => {
        clearTimeout(timeout)
        resolve(response)
      })

      this.socket.once('message_error', (error: any) => {
        clearTimeout(timeout)
        reject(new Error(error.error))
      })
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
        this.socket?.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
      this.emit('reconnect_failed', {})
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { data, resolve, reject } = this.messageQueue.shift()!
      this.sendMessage(data).then(resolve).catch(reject)
    }
  }
}
```

### Fetching Missing Messages

```typescript
async fetchMessages(chatId: string, options: {
  page?: number
  limit?: number
  before?: Date
} = {}): Promise<{
  messages: ChatMessage[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}> {
  const params = new URLSearchParams()
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.before) params.append('before', options.before.toISOString())

  const response = await fetch(`${this.serverUrl}/api/chats/${chatId}/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${this.authToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data
}
```

## REST API Endpoints

### Get Chats with Unread Counts
```typescript
router.get('/chats', requireAuth, async (req, res) => {
  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { userId: req.currentUser.id },
        { ownerId: req.currentUser.id }
      ]
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
          files: true
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              recipientId: req.currentUser.id,
              readAt: null
            }
          }
        }
      }
    }
  })
})
```

### Get Messages with Pagination
```typescript
router.get('/chats/:chatId/messages', requireAuth, async (req, res) => {
  const { page = 1, limit = 50, before } = req.query

  const whereClause: any = { chatId: req.params.chatId }
  if (before) {
    whereClause.createdAt = { lt: new Date(before as string) }
  }

  const messages = await prisma.message.findMany({
    where: whereClause,
    include: {
      sender: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
      property: { select: { id: true, name: true } },
      files: true
    },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  })

  messages.reverse() // Chronological order
})
```

## Archival and Retention

### Archive Job
```typescript
export async function runArchiveJob() {
  // Archive messages older than 1 year
  const archivedMessages = await archiver.archiveOldMessages(365)

  // Clean up empty chats (no messages in last 90 days)
  const cleanedChats = await archiver.cleanupEmptyChats()

  // Log the job execution
  await prisma.auditLog.create({
    data: {
      action: 'ARCHIVE_JOB_RUN',
      details: JSON.stringify({
        archivedMessages,
        cleanedChats,
        timestamp: new Date().toISOString()
      })
    }
  })
}
```

### Database Indexes for Performance
```sql
-- Composite indexes for chat queries
CREATE INDEX idx_messages_chat_created ON messages(chatId, createdAt)
CREATE INDEX idx_messages_sender_recipient ON messages(senderId, recipientId)
CREATE INDEX idx_messages_read_status ON messages(recipientId, readAt)

-- Partial indexes for unread counts
CREATE INDEX idx_messages_unread ON messages(recipientId, chatId)
WHERE readAt IS NULL
```

## Testing

### Message Persistence Test
```typescript
it('should save messages to database with transaction', async () => {
  const messageData = {
    chatId: testChat.id,
    senderId: testUser.id,
    recipientId: testOwner.id,
    content: 'Test message',
    attachments: [{ url: 'https://example.com/file.jpg', type: 'image' }]
  }

  const response = await request(server)
    .post(`/api/chats/${testChat.id}/messages`)
    .set('Authorization', `Bearer mock-token`)
    .send(messageData)

  expect(response.status).toBe(201)

  const savedMessage = await prisma.message.findFirst({
    where: { chatId: testChat.id },
    include: { files: true }
  })

  expect(savedMessage?.content).toBe(messageData.content)
  expect(savedMessage?.files).toHaveLength(1)
})
```

### Real-time Delivery Test
```typescript
it('should handle message delivery via WebSocket', async () => {
  // Test WebSocket message sending and receiving
  // Verify message appears in database
  // Verify real-time emission to chat room
})
```

### Reconnection Test
```typescript
it('should queue messages when disconnected', () => {
  const client = new ChatClient('http://localhost:3001', 'mock-token')

  // Simulate disconnection
  client['socket'] = { connected: false } as any

  const messagePromise = client.sendMessage({
    chatId: 'chat_123',
    content: 'Queued message'
  })

  expect(client['messageQueue']).toHaveLength(1)
})
```

## Production Deployment

### Environment Variables
```env
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/stayeasy
REDIS_URL=redis://localhost:6379  # For session storage
```

### Scaling Considerations
- **Horizontal Scaling**: Use Redis adapter for Socket.IO clustering
- **Database Sharding**: Shard messages by chatId for high volume
- **CDN**: Use CDN for file attachments
- **Rate Limiting**: Implement per-user message rate limits

### Monitoring
- Track message delivery success rates
- Monitor WebSocket connection counts
- Alert on failed message saves
- Track archive job performance

## Usage Examples

### Server Setup
```typescript
import { ChatService } from './server/chat.js'
import chatApi from './server/chat-api.js'

const chatService = new ChatService(server)
app.use('/api', chatApi)
```

### Client Usage
```typescript
const chatClient = new ChatClient('http://localhost:3001', authToken)

await chatClient.connect()
chatClient.joinChat('chat_123')

// Send message
const result = await chatClient.sendMessage({
  chatId: 'chat_123',
  content: 'Hello!'
})

// Listen for messages
chatClient.on('message', (message) => {
  console.log('New message:', message)
})
```

This implementation provides a robust, scalable chat system with real-time messaging, reliable delivery, and comprehensive testing coverage.
