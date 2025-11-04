"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatArchiver = exports.ChatService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ChatService {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const session = await prisma.session.findUnique({
                    where: { token: decoded.sessionToken },
                    include: { user: true }
                });
                if (!session || session.expiresAt < new Date()) {
                    return next(new Error('Session expired'));
                }
                socket.userId = session.userId;
                socket.userRole = session.user.role;
                socket.sessionId = session.id;
                next();
            }
            catch (error) {
                next(new Error('Authentication failed'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.userId} connected`);
            // Join user's room for private messages
            socket.join(`user_${socket.userId}`);
            // Handle joining chat rooms
            socket.on('join_chat', (chatId) => {
                socket.join(`chat_${chatId}`);
                console.log(`User ${socket.userId} joined chat ${chatId}`);
            });
            // Handle leaving chat rooms
            socket.on('leave_chat', (chatId) => {
                socket.leave(`chat_${chatId}`);
                console.log(`User ${socket.userId} left chat ${chatId}`);
            });
            // Handle sending messages
            socket.on('send_message', async (data) => {
                try {
                    const savedMessage = await this.handleMessage(socket, data);
                    // Send ACK to sender
                    socket.emit('message_sent', { tempId: data.tempId, ...savedMessage });
                }
                catch (error) {
                    socket.emit('message_error', {
                        error: error.message || 'Failed to send message',
                        originalMessage: data
                    });
                }
            });
            // Handle typing indicators
            socket.on('typing_start', (chatId) => {
                socket.to(`chat_${chatId}`).emit('user_typing', {
                    userId: socket.userId,
                    chatId
                });
            });
            socket.on('typing_stop', (chatId) => {
                socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
                    userId: socket.userId,
                    chatId
                });
            });
            // Handle read receipts
            socket.on('mark_read', async (data) => {
                try {
                    await this.markMessagesRead(socket.userId, data.messageIds);
                    socket.to(`chat_${data.chatId}`).emit('messages_read', {
                        chatId: data.chatId,
                        readerId: socket.userId,
                        messageIds: data.messageIds
                    });
                }
                catch (error) {
                    console.error('Failed to mark messages read:', error);
                }
            });
            socket.on('disconnect', () => {
                console.log(`User ${socket.userId} disconnected`);
            });
        });
    }
    async handleMessage(socket, data) {
        const { chatId, content, attachments } = data;
        // Verify user has access to this chat
        // This check is critical for security
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { user: true, owner: true }
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        if (chat.userId !== socket.userId && chat.ownerId !== socket.userId) {
            throw new Error('Unauthorized access to chat');
        }
        // Determine recipient
        const recipientId = chat.userId === socket.userId ? chat.ownerId : chat.userId;
        // Use transaction to ensure message and files are saved atomically
        const savedMessage = await prisma.$transaction(async (tx) => {
            // Create message
            const message = await tx.message.create({
                data: {
                    chatId,
                    senderId: socket.userId,
                    recipientId,
                    content,
                    createdAt: new Date(),
                    senderType: socket.userRole,
                }
            });
            // Create file attachments if any
            if (attachments && attachments.length > 0) {
                await tx.file.createMany({
                    data: attachments.map(attachment => ({
                        messageId: message.id,
                        url: attachment.url,
                        fileName: attachment.url.split('/').pop() || 'attachment',
                        fileType: attachment.type,
                        userId: socket.userId
                    }))
                });
            }
            // Get complete message with files
            return await tx.message.findUnique({
                where: { id: message.id },
                include: {
                    files: true
                }
            });
        });
        if (!savedMessage) {
            throw new Error('Failed to save message');
        }
        // Update chat's updatedAt timestamp for sorting chat lists
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });
        // Emit to chat room
        this.io.to(`chat_${chatId}`).emit('new_message', savedMessage);
        // Emit to recipient's private room (for notifications)
        this.io.to(`user_${recipientId}`).emit('message_notification', {
            chatId,
            message: savedMessage,
            unreadCount: await this.getUnreadCount(recipientId)
        });
        return { id: savedMessage.id, chatId, createdAt: savedMessage.createdAt };
    }
    async markMessagesRead(userId, messageIds) {
        await prisma.message.updateMany({
            where: {
                id: { in: messageIds },
                recipientId: userId,
                readAt: null
            },
            data: {
                readAt: new Date()
            }
        });
    }
    async getUnreadCount(userId) {
        const result = await prisma.message.aggregate({
            where: {
                recipientId: userId,
                readAt: null
            },
            _count: true
        });
        return result._count;
    }
    // Method to send message from server (for system notifications, etc.)
    async sendSystemMessage(chatId, content) {
        const message = await prisma.message.create({
            data: {
                chatId,
                senderId: 'system',
                recipientId: 'system', // System messages don't have recipients
                content,
                senderType: 'SYSTEM'
            },
            include: {
                files: true
            }
        });
        this.io.to(`chat_${chatId}`).emit('new_message', message);
    }
    // Get chat service instance
    getIO() {
        return this.io;
    }
}
exports.ChatService = ChatService;
// Archive job for old messages
class ChatArchiver {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async archiveOldMessages(daysOld = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        // Move messages to archive table (you'd create this table separately)
        const oldMessages = await this.prisma.message.findMany({
            where: {
                createdAt: { lt: cutoffDate }
            },
            include: { files: true }
        });
        if (oldMessages.length > 0) {
            // In a real implementation, you'd:
            // 1. Insert into archive_messages table
            // 2. Insert into archive_files table
            // 3. Delete from main tables
            console.log(`Archiving ${oldMessages.length} messages older than ${cutoffDate.toISOString()}`);
            // For now, just log (implement actual archiving based on your storage strategy)
            await this.logArchiveAction(oldMessages.length, cutoffDate);
        }
        return oldMessages.length;
    }
    async logArchiveAction(messageCount, cutoffDate) {
        await this.prisma.auditLog.create({
            data: {
                action: 'CHAT_ARCHIVE',
                details: JSON.stringify({
                    messageCount,
                    cutoffDate: cutoffDate.toISOString()
                })
            }
        });
    }
    // Clean up empty chats (no messages in last 90 days)
    async cleanupEmptyChats() {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const emptyChats = await this.prisma.chat.findMany({
            where: {
                messages: {
                    none: {
                        createdAt: { gte: ninetyDaysAgo }
                    }
                }
            }
        });
        if (emptyChats.length > 0) {
            await this.prisma.chat.deleteMany({
                where: {
                    id: { in: emptyChats.map(c => c.id) }
                }
            });
            console.log(`Cleaned up ${emptyChats.length} empty chats`);
        }
        return emptyChats.length;
    }
}
exports.ChatArchiver = ChatArchiver;
