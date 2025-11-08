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
      receiver_id: to_id,
      property_id,
      content,
      read: false
    } as any)
    .select();
    
  if (error) throw error;
  return data[0];
}