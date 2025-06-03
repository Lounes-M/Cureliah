import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  type: 'doctor' | 'establishment';
  created_at: string;
}

export const createReview = async (
  reviewerId: string,
  reviewedId: string,
  rating: number,
  comment: string,
  type: 'doctor' | 'establishment'
) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating,
          comment,
          type
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReviews = async (userId: string, type: 'doctor' | 'establishment') => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey (
          id,
          first_name,
          last_name,
          user_type
        ),
        reviewed:profiles!reviews_reviewed_id_fkey (
          id,
          first_name,
          last_name,
          user_type
        )
      `)
      .eq('reviewed_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const calculateAverageRating = (reviews: Review[]) => {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
};

export const deleteReview = async (reviewId: string) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting review:', error);
    throw error;
  }
}; 