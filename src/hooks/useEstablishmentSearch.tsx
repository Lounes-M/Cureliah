import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';

interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  experience_years?: number;
  avatar_url?: string;
  bio?: string;
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  languages?: string[];
  license_number?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  speciality?: string;
  availability?: {
    days: string[];
    hours: string;
  };
  sub_specialties?: string[];
  is_verified?: boolean;
  is_active?: boolean;
  hourly_rate?: string;
  user_type?: string;
}

export interface VacationWithDoctor extends VacationPost {
  doctor_info: DoctorInfo | null;
  doctor: DoctorInfo | null;
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
      navigate('/auth?type=establishment');
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
      setLoading(true);
      // Récupérer les vacations disponibles
      const { data: vacationsData, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor:doctor_profiles!vacation_posts_doctor_id_fkey (
            id,
            license_number,
            experience_years,
            hourly_rate,
            bio,
            avatar_url,
            is_verified,
            created_at,
            updated_at,
            speciality,
            availability,
            education,
            languages,
            sub_specialties,
            profiles!doctor_profiles_id_fkey (
              id,
              first_name,
              last_name,
              email,
              phone,
              user_type,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (vacationsError) {
        console.error('Error fetching vacations:', vacationsError);
        throw vacationsError;
      }

      console.log('Raw vacations data:', JSON.stringify(vacationsData, null, 2));

      if (!vacationsData || vacationsData.length === 0) {
        setVacations([]);
        setFilteredVacations([]);
        return;
      }

      // Transformer les données
      const vacationsWithDoctors = vacationsData.map(vacation => {
        console.log('Processing vacation:', vacation.id);
        console.log('Raw doctor data:', JSON.stringify(vacation.doctor, null, 2));
        console.log('Doctor profiles data:', JSON.stringify(vacation.doctor?.profiles, null, 2));
        console.log('Doctor profiles first_name:', vacation.doctor?.profiles?.first_name);
        console.log('Doctor profiles last_name:', vacation.doctor?.profiles?.last_name);

        const doctorInfo = vacation.doctor ? {
          id: vacation.doctor.id,
          first_name: vacation.doctor.profiles?.first_name || '',
          last_name: vacation.doctor.profiles?.last_name || '',
          email: vacation.doctor.profiles?.email,
          phone: vacation.doctor.profiles?.phone,
          experience_years: vacation.doctor.experience_years,
          avatar_url: vacation.doctor.avatar_url,
          bio: vacation.doctor.bio,
          education: vacation.doctor.education,
          languages: vacation.doctor.languages,
          license_number: vacation.doctor.license_number,
          created_at: vacation.doctor.profiles?.created_at,
          updated_at: vacation.doctor.profiles?.updated_at,
          speciality: vacation.doctor.speciality,
          availability: vacation.doctor.availability,
          sub_specialties: vacation.doctor.sub_specialties,
          is_verified: vacation.doctor.is_verified,
          is_active: vacation.doctor.profiles?.is_active,
          user_type: vacation.doctor.profiles?.user_type,
          hourly_rate: vacation.doctor.hourly_rate
        } : null;

        console.log('Transformed doctor info:', JSON.stringify(doctorInfo, null, 2));

        return {
          ...vacation,
          doctor_info: doctorInfo,
          doctor: doctorInfo
        };
      });

      console.log('Final transformed data:', JSON.stringify(vacationsWithDoctors, null, 2));

      setVacations(vacationsWithDoctors);
      setFilteredVacations(vacationsWithDoctors);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des vacations",
        variant: "destructive"
      });
      setVacations([]);
      setFilteredVacations([]);
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
