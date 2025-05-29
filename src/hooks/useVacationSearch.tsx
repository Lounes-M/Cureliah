
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VacationPost {
  id: string;
  title: string;
  description: string;
  speciality: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location: string;
  requirements: string;
  doctor_id: string;
  created_at: string;
  doctor_profiles?: {
    bio: string;
    experience_years: number;
    license_number: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface SearchFilters {
  speciality: string;
  location: string;
  minRate: string;
  maxRate: string;
  startDate: string;
  endDate: string;
}

export const useVacationSearch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    speciality: '',
    location: '',
    minRate: '',
    maxRate: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.user_type !== 'establishment') {
      navigate('/doctor/dashboard');
      return;
    }

    fetchVacations();
  }, [user, profile]);

  const fetchVacations = async (searchFilters?: SearchFilters) => {
    try {
      setSearchLoading(true);
      
      // First, get vacation posts with doctor_profiles relationship
      let vacationQuery = supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles(bio, experience_years, license_number)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      const currentFilters = searchFilters || filters;
      
      if (currentFilters.speciality) {
        vacationQuery = vacationQuery.eq('speciality', currentFilters.speciality);
      }
      
      if (currentFilters.location) {
        vacationQuery = vacationQuery.ilike('location', `%${currentFilters.location}%`);
      }
      
      if (currentFilters.minRate) {
        vacationQuery = vacationQuery.gte('hourly_rate', parseFloat(currentFilters.minRate));
      }
      
      if (currentFilters.maxRate) {
        vacationQuery = vacationQuery.lte('hourly_rate', parseFloat(currentFilters.maxRate));
      }
      
      if (currentFilters.startDate) {
        vacationQuery = vacationQuery.gte('start_date', currentFilters.startDate);
      }
      
      if (currentFilters.endDate) {
        vacationQuery = vacationQuery.lte('end_date', currentFilters.endDate);
      }

      const { data: vacationsData, error: vacationsError } = await vacationQuery;

      if (vacationsError) {
        console.error('Error fetching vacations:', vacationsError);
        throw vacationsError;
      }

      // Then get doctor profile information separately
      if (vacationsData && vacationsData.length > 0) {
        const doctorIds = vacationsData.map(vacation => vacation.doctor_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine the data
        const combinedData = vacationsData.map(vacation => ({
          ...vacation,
          profiles: profilesData?.find(profile => profile.id === vacation.doctor_id)
        }));

        setVacations(combinedData || []);
      } else {
        setVacations([]);
      }
    } catch (error: any) {
      console.error('Error in fetchVacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVacations(filters);
  };

  const handleBookVacation = async (vacationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .insert({
          vacation_post_id: vacationId,
          establishment_id: user.id,
          doctor_id: vacations.find(v => v.id === vacationId)?.doctor_id,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

      toast({
        title: "Réservation envoyée !",
        description: "Votre demande de réservation a été envoyée au médecin.",
      });

      // Refresh the list
      fetchVacations();
    } catch (error: any) {
      console.error('Error in handleBookVacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de réservation",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      speciality: '',
      location: '',
      minRate: '',
      maxRate: '',
      startDate: '',
      endDate: ''
    };
    setFilters(clearedFilters);
    fetchVacations(clearedFilters);
  };

  return {
    vacations,
    loading,
    searchLoading,
    filters,
    setFilters,
    handleSearch,
    handleBookVacation,
    clearFilters
  };
};
