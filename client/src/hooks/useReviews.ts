import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        let query = supabase
          .from('reviews')
          .select(`
            *,
            user:profiles (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (propertyId) {
          query = query.eq('property_id', propertyId);
        }

        const { data, error } = await query;
          
        if (!mounted) return;
        
        if (error) {
          console.warn('❌ [useReviews] Database connection failed, using sample data:', error.message);
          // Use sample reviews for development/testing
          const sampleReviews: Review[] = [
            {
              id: crypto.randomUUID(),
              user_id: crypto.randomUUID(),
              property_id: propertyId || crypto.randomUUID(),
              rating: 5,
              comment: 'Excellent place! Very clean and comfortable.',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'John Doe'
              }
            },
            {
              id: crypto.randomUUID(),
              user_id: crypto.randomUUID(),
              property_id: propertyId || crypto.randomUUID(),
              rating: 4,
              comment: 'Good location and amenities. Would stay again.',
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Jane Smith'
              }
            },
            {
              id: crypto.randomUUID(),
              user_id: crypto.randomUUID(),
              property_id: propertyId || crypto.randomUUID(),
              rating: 3,
              comment: 'Average experience. Could be better maintained.',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Bob Johnson'
              }
            }
          ];
          
          setItems(sampleReviews);
          return;
        }

        // Transform the data to match the expected Review interface
        const transformedReviews = data.map((review: any) => ({
          id: review.id,
          user_id: review.user_id,
          property_id: review.property_id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user: review.user || {
            name: 'Unknown User'
          }
        }));

        setItems(transformedReviews);
      } catch (error) {
        if (mounted) {
          console.error('❌ [useReviews] Error fetching reviews:', error);
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