
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';

export function useRecentVacations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVacations();
    }
  }, [user]);

  const fetchVacations = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('vacation_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // For doctors, show their own vacations
      if (user.user_type === 'doctor') {
        query = query.eq('doctor_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVacations(data || []);
    } catch (error: any) {
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
