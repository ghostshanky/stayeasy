import { supabase } from "./supabase";

export async function sendMessage({ from_id, to_id, property_id, content }: {
  from_id: string;
  to_id: string;
  property_id?: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: from_id,
      recipient_id: to_id,
      content,
      sender_type: 'USER'
    } as any)
    .select();

  if (error) throw error;
  return data[0];
}

export async function getMessages(userId: string, otherUserId?: string) {
  let query = supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true });

  if (otherUserId) {
    query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(messageIds: string[], userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() } as any)
    .in('id', messageIds)
    .eq('recipient_id', userId) as any;

  if (error) throw error;
}

export async function getConversations(userId: string) {
  // Get all messages for this user, grouped by conversation
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group messages by conversation (other user)
  const conversations = new Map();

  data.forEach((message: any) => {
    const otherUserId = message.sender_id === userId ? message.recipient_id : message.sender_id;

    if (!conversations.has(otherUserId)) {
      conversations.set(otherUserId, {
        otherUserId,
        messages: [],
        lastMessage: message,
        unreadCount: 0
      });
    }

    const conv = conversations.get(otherUserId);
    conv.messages.unshift(message); // Add to beginning since we ordered desc

    if (message.recipient_id === userId && !message.read_at) {
      conv.unreadCount++;
    }
  });

  return Array.from(conversations.values());
}
