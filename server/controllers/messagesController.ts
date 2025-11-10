import express from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuditLogger } from '../audit-logger.js';

const router = express.Router();

// Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_ID_REQUIRED', message: 'User ID is required' }
      });
    }

    // Get all messages for this user
    const { data: messages, error } = await supabaseServer
      .from('messages')
      .select(`
        *,
        sender: id,
        recipient: id,
        property: id,
        files (url, file_name)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Group messages by conversation
    const conversations = new Map();
    
    messages.forEach((message: any) => {
      const otherUserId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          otherUserId,
          otherUserName: message.sender_id === userId ? message.recipient?.name : message.sender?.name,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        });
      }
      
      const conv = conversations.get(otherUserId);
      conv.messages.unshift(message);
      
      if (message.recipient_id === userId && !message.read_at) {
        conv.unreadCount++;
      }
    });

    res.json({
      success: true,
      data: Array.from(conversations.values())
    });

  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversations.' }
    });
  }
});

// Get messages between two users
router.get('/conversation', async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_IDS_REQUIRED', message: 'Both user IDs are required' }
      });
    }

    const { data: messages, error } = await supabaseServer
      .from('messages')
      .select(`
        *,
        files (url, file_name, file_type)
      `)
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Mark messages as read for the recipient
    const unreadMessages = messages.filter((msg: any) => 
      msg.recipient_id === userId1 && !msg.read_at
    );
    
    if (unreadMessages.length > 0) {
      await supabaseServer
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessages.map((msg: any) => msg.id));
    }

    res.json({
      success: true,
      data: messages
    });

  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversation.' }
    });
  }
});

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { sender_id, recipient_id, content, property_id } = req.body;
    
    if (!sender_id || !recipient_id || !content) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'sender_id, recipient_id, and content are required' }
      });
    }

    // Insert message
    const { data: message, error } = await supabaseServer
      .from('messages')
      .insert({
        sender_id,
        recipient_id,
        content: content.trim(),
        property_id,
        read_at: null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Get complete message with sender info
    const { data: fullMessage, error: fetchError } = await supabaseServer
      .from('messages')
      .select(`
        *,
        sender: name,
        recipient: name,
        property: id,
        files (url, file_name, file_type)
      `)
      .eq('id', message.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch complete message: ${fetchError.message}`);
    }

    // Log audit event
    await AuditLogger.logUserAction(sender_id, 'MESSAGE_SENT', `Message sent to ${recipient_id}`);

    res.status(201).json({
      success: true,
      data: fullMessage
    });

  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send message.' }
    });
  }
});

// Mark messages as read
router.put('/read', async (req, res) => {
  try {
    const { messageIds, userId } = req.body;
    
    if (!Array.isArray(messageIds) || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'messageIds must be an array and userId is required' }
      });
    }

    const { error } = await supabaseServer
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('recipient_id', userId);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error: any) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark messages as read.' }
    });
  }
});

// Get user's messages with pagination
router.get('/', async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_ID_REQUIRED', message: 'User ID is required' }
      });
    }

    // Get total count
    const { count, error: countError } = await supabaseServer
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    if (countError) {
      throw new Error(`Failed to count messages: ${countError.message}`);
    }

    // Get messages with pagination
    const { data: messages, error } = await supabaseServer
      .from('messages')
      .select(`
        *,
        sender: name,
        recipient: name,
        property: id,
        files (url, file_name, file_type)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const totalPages = Math.ceil(count! / Number(limit));

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        totalPages,
        total: count!,
        limit: Number(limit)
      }
    });

  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages.' }
    });
  }
});

export default router;