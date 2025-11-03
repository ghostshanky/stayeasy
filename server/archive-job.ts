import { PrismaClient } from '@prisma/client'
import { ChatArchiver } from './chat'

const prisma = new PrismaClient()
const archiver = new ChatArchiver()

// Archive job - run daily
export async function runArchiveJob() {
  console.log('Starting chat archive job...')

  try {
    // Archive messages older than 1 year
    const archivedMessages = await archiver.archiveOldMessages(365)
    console.log(`Archived ${archivedMessages} old messages`)

    // Clean up empty chats (no messages in last 90 days)
    const cleanedChats = await archiver.cleanupEmptyChats()
    console.log(`Cleaned up ${cleanedChats} empty chats`)

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

    console.log('Archive job completed successfully')
  } catch (error) {
    console.error('Archive job failed:', error)

    // Log the failure
    await prisma.auditLog.create({
      data: {
        action: 'ARCHIVE_JOB_FAILED',
        details: JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    })
  }
}

// Retention policies
export const RETENTION_POLICIES = {
  // Keep messages for 1 year
  MESSAGE_RETENTION_DAYS: 365,

  // Keep chats with no activity for 90 days
  EMPTY_CHAT_RETENTION_DAYS: 90,

  // Archive to cheaper storage after 6 months
  ARCHIVE_THRESHOLD_DAYS: 180
}

// Database indexes for performance (already in schema):
/*
Indexes created for chat system:
- messages: chatId, senderId, recipientId, propertyId, createdAt, readAt
- messages: (senderId, recipientId), (chatId, createdAt)
- chats: userId, ownerId, createdAt
- files: messageId, createdAt
*/

// Partitioning strategy (for very high volume):
/*
If you have millions of messages, consider partitioning by month:
- Create monthly partitions for messages table
- Partition by chatId for even distribution
- Use PostgreSQL table partitioning
*/

// Example partitioning setup:
/*
-- Create partitioned messages table
CREATE TABLE messages_partitioned (
  id VARCHAR(255) NOT NULL,
  chatId VARCHAR(255) NOT NULL,
  -- ... other columns
  createdAt TIMESTAMP NOT NULL
) PARTITION BY RANGE (createdAt);

-- Create monthly partitions
CREATE TABLE messages_2024_01 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE messages_2024_02 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- etc.
*/

// Monitoring queries
export async function getChatMetrics() {
  const [
    totalMessages,
    totalChats,
    activeChats,
    unreadMessages
  ] = await Promise.all([
    prisma.message.count(),
    prisma.chat.count(),
    prisma.chat.count({
      where: {
        messages: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    }),
    prisma.message.count({
      where: { readAt: null }
    })
  ])

  return {
    totalMessages,
    totalChats,
    activeChats,
    unreadMessages,
    messagesPerChat: totalChats > 0 ? totalMessages / totalChats : 0
  }
}

// Cleanup orphaned data
export async function cleanupOrphanedData() {
  // Remove messages with deleted chats
  const orphanedMessages = await prisma.message.deleteMany({
    where: {
      chat: null
    }
  })

  // Remove files with deleted messages
  const orphanedFiles = await prisma.file.deleteMany({
    where: {
      message: null
    }
  })

  console.log(`Cleaned up ${orphanedMessages.count} orphaned messages and ${orphanedFiles.count} orphaned files`)

  return {
    orphanedMessages: orphanedMessages.count,
    orphanedFiles: orphanedFiles.count
  }
}

// Run archive job if called directly
if (require.main === module) {
  runArchiveJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
