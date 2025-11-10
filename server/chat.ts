import { Server as HTTPServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { supabaseServer } from './lib/supabaseServer.js'

export interface AuthenticatedSocket extends Socket {
  userId: string
  userRole: string
}

export class ChatService {
  private io: SocketServer

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, 'stay-easy-secret') as any
        const { data: user, error } = await supabaseServer
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (error || !user) {
          return next(new Error('User not found'))
        }

        socket.userId = user.id
        socket.userRole = user.role

        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`User ${socket.userId} connected`)

      // Join user's room for private messages
      socket.join(`user_${socket.userId}`)

      // Handle joining chat rooms
      socket.on('join_chat', (chatId: string) => {
        socket.join(`chat_${chatId}`)
        console.log(`User ${socket.userId} joined chat ${chatId}`)
      })

      // Handle leaving chat rooms
      socket.on('leave_chat', (chatId: string) => {
        socket.leave(`chat_${chatId}`)
        console.log(`User ${socket.userId} left chat ${chatId}`)
      })

      // Handle sending messages
      socket.on('send_message', async (data: {
        chatId: string
        content: string
        tempId?: string
        propertyId?: string
        attachments?: Array<{ url: string, type: string }>
      }) => {
        try {
          const savedMessage = await this.handleMessage(socket, data)
          // Send ACK to sender
          socket.emit('message_sent', { tempId: data.tempId, ...savedMessage })
        } catch (error) {
          socket.emit('message_error', {
            error: (error as Error).message || 'Failed to send message',
            originalMessage: data
          })
        }
      })

      // Handle typing indicators
      socket.on('typing_start', (chatId: string) => {
        socket.to(`chat_${chatId}`).emit('user_typing', {
          userId: socket.userId,
          chatId
        })
      })

      socket.on('typing_stop', (chatId: string) => {
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          chatId
        })
      })

      // Handle read receipts
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

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`)
      })
    })
  }

  private async handleMessage(socket: AuthenticatedSocket, data: {
    chatId: string
    content: string
    tempId?: string // Temporary client-side ID for ACK mapping
    propertyId?: string
    attachments?: Array<{ url: string, type: string }>
  }) {
    const { chatId, content, attachments } = data

    // Verify user has access to this chat
    // This check is critical for security
    const { data: chat, error: chatError } = await supabaseServer
      .from('chats')
      .select('*, users(*), owners(*)')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      throw new Error('Chat not found')
    }

    if (chat.user_id !== socket.userId && chat.owner_id !== socket.userId) {
      throw new Error('Unauthorized access to chat')
    }

    // Determine recipient
    const recipientId = chat.user_id === socket.userId ? chat.owner_id : chat.user_id

    // Create message
    const { data: message, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: socket.userId,
        recipient_id: recipientId,
        content,
        sender_type: socket.userRole,
      })
      .select()
      .single()

    if (messageError || !message) {
      throw new Error('Failed to save message')
    }

    // Create file attachments if any
    if (attachments && attachments.length > 0) {
      const fileInserts = attachments.map(attachment => ({
        message_id: message.id,
        url: attachment.url,
        file_name: attachment.url.split('/').pop() || 'attachment',
        file_type: attachment.type,
        user_id: socket.userId
      }))

      const { error: fileError } = await supabaseServer
        .from('files')
        .insert(fileInserts)

      if (fileError) {
        console.error('Failed to save attachments:', fileError)
      }
    }

    // Get complete message with files
    const { data: savedMessage, error: fetchError } = await supabaseServer
      .from('messages')
      .select('*, files(*)')
      .eq('id', message.id)
      .single()

    if (fetchError || !savedMessage) {
      throw new Error('Failed to retrieve saved message')
    }

    // Update chat's updated_at timestamp for sorting chat lists
    await supabaseServer
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    // Emit to chat room
    this.io.to(`chat_${chatId}`).emit('new_message', savedMessage)

    // Emit to recipient's private room (for notifications)
    this.io.to(`user_${recipientId}`).emit('message_notification', {
      chatId,
      message: savedMessage,
      unreadCount: await this.getUnreadCount(recipientId)
    })
    
    return { id: savedMessage.id, chatId, createdAt: savedMessage.createdAt };
  }

  private async markMessagesRead(userId: string, messageIds: string[]) {
    const { error } = await supabaseServer
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('recipient_id', userId)
      .is('read_at', null)

    if (error) {
      console.error('Failed to mark messages read:', error)
    }
  }

  private async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseServer
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)

    if (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }

    return count || 0
  }

  // Method to send message from server (for system notifications, etc.)
  async sendSystemMessage(chatId: string, content: string) {
    const { data: message, error } = await supabaseServer
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: 'system',
        recipient_id: 'system', // System messages don't have recipients
        content,
        sender_type: 'SYSTEM'
      })
      .select('*, files(*)')
      .single()

    if (error || !message) {
      console.error('Failed to send system message:', error)
      return
    }

    this.io.to(`chat_${chatId}`).emit('new_message', message)
  }

  // Get chat service instance
  getIO(): SocketServer {
    return this.io
  }
}

// Archive job for old messages
export class ChatArchiver {
  async archiveOldMessages(daysOld: number = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Move messages to archive table (you'd create this table separately)
    const { data: oldMessages, error } = await supabaseServer
      .from('messages')
      .select('*, files(*)')
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Failed to fetch old messages:', error)
      return 0
    }

    if (oldMessages && oldMessages.length > 0) {
      // In a real implementation, you'd:
      // 1. Insert into archive_messages table
      // 2. Insert into archive_files table
      // 3. Delete from main tables

      console.log(`Archiving ${oldMessages.length} messages older than ${cutoffDate.toISOString()}`)

      // For now, just log (implement actual archiving based on your storage strategy)
      await this.logArchiveAction(oldMessages.length, cutoffDate)
    }

    return oldMessages?.length || 0
  }

  private async logArchiveAction(messageCount: number, cutoffDate: Date) {
    const { error } = await supabaseServer
      .from('audit_logs')
      .insert({
        action: 'CHAT_ARCHIVE',
        details: JSON.stringify({
          messageCount,
          cutoffDate: cutoffDate.toISOString()
        })
      })

    if (error) {
      console.error('Failed to log archive action:', error)
    }
  }

  // Clean up empty chats (no messages in last 90 days)
  async cleanupEmptyChats() {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Get chats with no recent messages
    const { data: emptyChats, error } = await supabaseServer
      .from('chats')
      .select('id')
      .not('messages', 'created_at.gte', ninetyDaysAgo.toISOString())

    if (error) {
      console.error('Failed to fetch empty chats:', error)
      return 0
    }

    if (emptyChats && emptyChats.length > 0) {
      const { error: deleteError } = await supabaseServer
        .from('chats')
        .delete()
        .in('id', emptyChats.map((c: any) => c.id))

      if (deleteError) {
        console.error('Failed to delete empty chats:', deleteError)
        return 0
      }

      console.log(`Cleaned up ${emptyChats.length} empty chats`)
    }

    return emptyChats?.length || 0
  }
}
