// Client-side chat implementation with Socket.IO
import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  recipientId: string
  content: string
  createdAt: Date
  readAt?: Date
  files?: Array<{
    id: string
    url: string
    type: string
  }>
  sender: {
    id: string
    name: string
    role: string
  }
  property?: {
    id: string
    name: string
  }
}

export interface Chat {
  id: string
  participant: {
    id: string
    name: string
    email: string
    role: string
  }
  latestMessage?: {
    id: string
    content: string
    senderId: string
    senderName: string
    createdAt: Date
    hasAttachments: boolean
  }
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

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

  // Initialize connection
  connect(): Promise<void> {
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
          // Server disconnected, try to reconnect
          this.handleReconnect()
        }
      })

      this.setupEventListeners()
    })
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Join a chat room
  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId)
    }
  }

  // Leave a chat room
  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId)
    }
  }

  // Send a message
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

  // Mark messages as read
  markAsRead(chatId: string, messageIds: string[]) {
    if (this.socket) {
      this.socket.emit('mark_read', { chatId, messageIds })
    }
  }

  // Typing indicators
  startTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', chatId)
    }
  }

  stopTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', chatId)
    }
  }

  // Event listeners
  private setupEventListeners() {
    if (!this.socket) return

    // New message received
    this.socket.on('new_message', (message: ChatMessage) => {
      this.emit('message', message)
    })

    // Message notification (for other tabs/windows)
    this.socket.on('message_notification', (data: {
      chatId: string
      message: ChatMessage
      unreadCount: number
    }) => {
      this.emit('notification', data)
    })

    // Messages marked as read
    this.socket.on('messages_read', (data: {
      chatId: string
      readerId: string
      messageIds: string[]
    }) => {
      this.emit('messages_read', data)
    })

    // User typing
    this.socket.on('user_typing', (data: { userId: string, chatId: string }) => {
      this.emit('typing_start', data)
    })

    this.socket.on('user_stopped_typing', (data: { userId: string, chatId: string }) => {
      this.emit('typing_stop', data)
    })
  }

  // Event emitter (simple implementation)
  private eventListeners: { [event: string]: Function[] } = {}

  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data))
    }
  }

  // Handle reconnection logic
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

  // Process queued messages after reconnection
  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { data, resolve, reject } = this.messageQueue.shift()!
      this.sendMessage(data).then(resolve).catch(reject)
    }
  }

  // Fetch messages via REST API (for initial load or when WebSocket fails)
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

  // Fetch chats list
  async fetchChats(options: { page?: number, limit?: number } = {}): Promise<{
    chats: Chat[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())

    const response = await fetch(`${this.serverUrl}/api/chats?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Send message via REST API (fallback)
  async sendMessageREST(data: {
    chatId: string
    content: string
    propertyId?: string
    attachments?: Array<{ url: string, type: string }>
  }): Promise<ChatMessage> {
    const response = await fetch(`${this.serverUrl}/api/chats/${data.chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Start new chat
  async startChat(data: {
    recipientId: string
    propertyId?: string
    initialMessage?: string
  }): Promise<{ chat: Chat, initialMessage?: ChatMessage }> {
    const response = await fetch(`${this.serverUrl}/api/chats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to start chat: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }
}

// React hook for using chat client
export function useChatClient(authToken: string, serverUrl?: string) {
  const [client] = useState(() => new ChatClient(serverUrl, authToken))
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    client.connect()
      .then(() => setIsConnected(true))
      .catch((error) => setConnectionError(error.message))

    client.on('reconnect_failed', () => {
      setConnectionError('Failed to reconnect to chat server')
      setIsConnected(false)
    })

    return () => {
      client.disconnect()
    }
  }, [client])

  return { client, isConnected, connectionError }
}

// Usage example:
/*
// Initialize client
const chatClient = new ChatClient('http://localhost:3001', authToken)

// Connect
await chatClient.connect()

// Join chat room
chatClient.joinChat('chat_123')

// Listen for messages
chatClient.on('message', (message) => {
  console.log('New message:', message)
})

// Send message
const result = await chatClient.sendMessage({
  chatId: 'chat_123',
  content: 'Hello!'
})

// Fetch message history
const { messages } = await chatClient.fetchMessages('chat_123', { limit: 50 })
*/
