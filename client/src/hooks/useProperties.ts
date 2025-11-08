import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  images: string[];
  rating?: number;
}

export function useProperties(limit = 12, page = 1) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchProperties = async () => {
      try {
        const res: PostgrestSingleResponse<Property[]> = await supabase
          .from("properties")
          .select("id, title, location, price_per_night, images, rating")
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
    
    fetchProperties();
    
    return () => { mounted = false; };
  }, [limit, page]);

  return { items, loading };
}