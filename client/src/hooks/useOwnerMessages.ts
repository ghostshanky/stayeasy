import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/apiClient";

interface OwnerMessage {
  id: string;
  chatId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  propertyId?: string;
  readAt?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  property?: {
    id: string;
    title: string;
  };
}

export function useOwnerMessages(limit = 10, page = 1) {
  const [items, setItems] = useState<OwnerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchMessages = async () => {
      try {
        const response = await apiClient.get('/messages/owner', {
          params: { limit, page }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setItems(response.data);
        } else {
          console.error('❌ [useOwnerMessages] Failed to fetch messages:', response.error);
          setError(response.error?.message || 'Failed to fetch messages');
          setItems([]);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner messages:", err);
          setError("Failed to fetch messages");
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    return () => {
      mounted = false;
    };
  }, [limit, page]);

  return { items, loading, error };
}