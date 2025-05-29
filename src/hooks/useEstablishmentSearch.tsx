
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';

interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  experience_years?: number;
}

export interface VacationWithDoctor extends VacationPost {
  doctor_info: DoctorInfo | null;
}

interface FilterState {
  location: string;
  speciality: string;
  startDate: string;
  endDate: string;
  minRate: string;
  maxRate: string;
}

export const useEstablishmentSearch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationWithDoctor[]>([]);
  const [filteredVacations, setFilteredVacations] = useState<VacationWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    speciality: '',
    startDate: '',
    endDate: '',
    minRate: '',
    maxRate: ''
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
  }, [user, profile, navigate]);

  useEffect(() => {
    applyFilters();
  }, [vacations, searchTerm, filters]);

  const fetchVacations = async () => {
    try {
      // Récupérer les vacations disponibles
      const { data: vacationsData, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (vacationsError) throw vacationsError;

      if (!vacationsData || vacationsData.length === 0) {
        setVacations([]);
        setFilteredVacations([]);
        return;
      }

      // Récupérer les informations des médecins
      const doctorIds = vacationsData.map(vacation => vacation.doctor_id);
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', doctorIds);

      if (doctorsError) {
        console.warn('Error fetching doctor profiles:', doctorsError);
      }

      // Récupérer les informations détaillées des médecins
      const { data: doctorProfiles, error: doctorProfilesError } = await supabase
        .from('doctor_profiles')
        .select('id, experience_years')
        .in('id', doctorIds);

      if (doctorProfilesError) {
        console.warn('Error fetching doctor detailed profiles:', doctorProfilesError);
      }

      // Combiner les données
      const combinedVacations = vacationsData.map(vacation => {
        const doctorProfile = doctorsData && doctorsData.length > 0 
          ? doctorsData.find(doc => doc.id === vacation.doctor_id) 
          : null;
        
        const doctorDetailedProfile = doctorProfiles && doctorProfiles.length > 0 
          ? doctorProfiles.find(dp => dp.id === vacation.doctor_id) 
          : null;

        const doctor_info = doctorProfile ? {
          id: doctorProfile.id,
          first_name: doctorProfile.first_name,
          last_name: doctorProfile.last_name,
          experience_years: doctorDetailedProfile?.experience_years
        } : null;

        return {
          ...vacation,
          doctor_info
        };
      });

      setVacations(combinedVacations as VacationWithDoctor[]);
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

  const applyFilters = () => {
    let filtered = [...vacations];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(vacation =>
        vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vacation.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vacation.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${vacation.doctor_info?.first_name} ${vacation.doctor_info?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtres avancés
    if (filters.location) {
      filtered = filtered.filter(vacation =>
        vacation.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.speciality) {
      filtered = filtered.filter(vacation =>
        vacation.speciality === filters.speciality
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(vacation =>
        new Date(vacation.start_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(vacation =>
        new Date(vacation.end_date) <= new Date(filters.endDate)
      );
    }

    if (filters.minRate) {
      filtered = filtered.filter(vacation =>
        vacation.hourly_rate >= parseFloat(filters.minRate)
      );
    }

    if (filters.maxRate) {
      filtered = filtered.filter(vacation =>
        vacation.hourly_rate <= parseFloat(filters.maxRate)
      );
    }

    setFilteredVacations(filtered);
  };

  return {
    vacations,
    filteredVacations,
    loading,
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    fetchVacations
  };
};
