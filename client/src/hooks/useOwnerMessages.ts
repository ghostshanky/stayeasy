import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface OwnerMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  content: string;
  read: boolean;
  created_at: string;
  sender: {
    name: string;
    email: string;
  };
  property?: {
    name: string;
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
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        const userId = session.user.id;

        // Fetch messages where the current user is the receiver
        const { data, error } = await (supabase as any)
          .from("messages")
          .select(`
            id,
            sender_id,
            receiver_id,
            property_id,
            content,
            read,
            created_at,
            sender:users(name, email),
            property:properties(name)
          `)
          .eq('receiver_id', userId)
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setItems(data || []);
      } catch (err) {
        if (mounted) {
          console.error("Error fetching owner messages:", err);
          setError("Failed to fetch messages");
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