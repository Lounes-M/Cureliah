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
  // hourly_rate?: string; // Removed for compliance
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
    endDate: ''
  });
  const applyFilters = () => {
    let filtered = [...vacations];
    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(vacation =>
        vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vacation.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vacation.speciality?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (`${vacation.doctor_info?.first_name} ${vacation.doctor_info?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
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

    setFilteredVacations(filtered);
  };

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
        throw vacationsError;
      }

      if (!vacationsData || vacationsData.length === 0) {
        setVacations([]);
        setFilteredVacations([]);
        return;
      }

      // Transformer les données
      const vacationsWithDoctors = vacationsData.map(vacation => {
        // Flatten doctor profile info
        const doctor = vacation.doctor;
        const doctorProfile = doctor?.profiles || {};
        return {
          ...vacation,
          doctor_info: doctor ? {
            id: doctor.id,
            first_name: doctorProfile.first_name || '',
            last_name: doctorProfile.last_name || '',
            email: doctorProfile.email,
            phone: doctorProfile.phone,
            experience_years: doctor.experience_years,
            avatar_url: doctor.avatar_url,
            bio: doctor.bio,
            availability: doctor.availability,
            sub_specialties: doctor.sub_specialties,
            is_verified: doctor.is_verified,
            is_active: doctorProfile.is_active,
            user_type: doctorProfile.user_type,
          } : null,
          doctor: doctor ? {
            id: doctor.id,
            first_name: doctorProfile.first_name || '',
            last_name: doctorProfile.last_name || '',
            email: doctorProfile.email,
            phone: doctorProfile.phone,
            experience_years: doctor.experience_years,
            avatar_url: doctor.avatar_url,
            bio: doctor.bio,
            availability: doctor.availability,
            sub_specialties: doctor.sub_specialties,
            is_verified: doctor.is_verified,
            is_active: doctorProfile.is_active,
            user_type: doctorProfile.user_type,
          } : null
        };
      });

      setVacations(vacationsWithDoctors);
      setFilteredVacations(vacationsWithDoctors);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des vacations",
        variant: "destructive"
      });
      setVacations([]);
      setFilteredVacations([]);
    } finally {
      setLoading(false);

  const applyFilters = () => {
    let filtered = [...vacations];
    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(vacation =>
        vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vacation.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vacation.speciality?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (`${vacation.doctor_info?.first_name} ${vacation.doctor_info?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Removed minRate and maxRate filters for compliance

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
