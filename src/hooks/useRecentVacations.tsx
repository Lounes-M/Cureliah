import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';

export function useRecentVacations() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user && profile) {
      fetchVacations();
    }
  }, [user, profile]);

  const fetchVacations = async () => {
    if (!user || !profile) return;

    try {
      let query = supabase
        .from('vacation_posts')
        .select(`
          *,
          time_slots (
            id,
            type,
            start_time,
            end_time,
            vacation_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // For doctors, show their own vacations
      if (profile.user_type === 'doctor') {
        query = query.eq('doctor_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('Vacations data with time slots:', data);
      setVacations(data || []);
    } catch (error: unknown) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    vacations,
    loading,
    refetch: fetchVacations
  };
}
