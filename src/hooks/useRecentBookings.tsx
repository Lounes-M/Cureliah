
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BookingWithVacation {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  vacation_post: {
    title: string;
    speciality: string;
    start_date: string;
    hourly_rate: number;
    location: string;
  };
}

export function useRecentBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithVacation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.user_type === 'establishment') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          status,
          created_at,
          total_amount,
          vacation_post:vacation_posts (
            title,
            speciality,
            start_date,
            hourly_rate,
            location
          )
        `)
        .eq('establishment_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    refetch: fetchBookings
  };
}
