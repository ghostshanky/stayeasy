import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

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
        // Get the current user ID from localStorage (where the auth token is stored)
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authenticated user");
        }

        const response = await apiClient.get(`/messages?userId=${token}&page=${page}&limit=${limit}`);

        if (!mounted) return;

        if (response.data.success) {
          setItems(response.data.data || []);
        } else {
          console.error("Error fetching owner messages:", response.data.error);
          setError(response.data.error?.message || "Failed to fetch messages");
        }
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