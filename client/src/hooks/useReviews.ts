import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface Review {
  id: string;
  user_id: string;
  property_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    name: string;
  };
}

export function useReviews(propertyId?: string, limit = 12, page = 1) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchReviews = async () => {
      try {
        let query = supabase
          .from("reviews")
          .select("id, user_id, property_id, rating, comment, created_at, user:name");
          
        if (propertyId) {
          query = query.eq("property_id", propertyId);
        }
          
        const res: PostgrestSingleResponse<Review[]> = await query
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);
          
        if (!mounted) return;
        
        if (res.error) {
          console.error(res.error);
        } else {
          setItems(res.data || []);
        }
      } catch (error) {
        if (mounted) {
          console.error(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchReviews();
    
    return () => { mounted = false; };
  }, [propertyId, limit, page]);

  return { items, loading };
}