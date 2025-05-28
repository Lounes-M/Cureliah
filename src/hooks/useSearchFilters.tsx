
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/components/SearchFilters';
import { VacationPost } from '@/types/database';

interface VacationPostWithProfile extends VacationPost {
  doctor_profile?: {
    first_name?: string;
    last_name?: string;
    speciality: string;
    experience_years?: number;
    hourly_rate?: number;
    is_verified: boolean;
  };
}

export function useSearchFilters(initialFilters?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    specialty: 'all',
    location: '',
    dateRange: { from: null, to: null },
    priceRange: [0, 200],
    experienceYears: 0,
    rating: 0,
    availabilityStatus: 'all',
    ...initialFilters
  });

  const [results, setResults] = useState<VacationPostWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const searchVacations = async (searchFilters: SearchFilters, page = 0, limit = 20) => {
    setLoading(true);
    try {
      let query = supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profile:doctor_profiles!vacation_posts_doctor_id_fkey(
            first_name,
            last_name,
            speciality,
            experience_years,
            hourly_rate,
            is_verified
          )
        `, { count: 'exact' });

      // Apply filters
      if (searchFilters.searchQuery) {
        query = query.or(`title.ilike.%${searchFilters.searchQuery}%,description.ilike.%${searchFilters.searchQuery}%`);
      }

      if (searchFilters.specialty && searchFilters.specialty !== 'all') {
        query = query.eq('speciality', searchFilters.specialty);
      }

      if (searchFilters.location) {
        query = query.ilike('location', `%${searchFilters.location}%`);
      }

      if (searchFilters.dateRange.from) {
        query = query.gte('start_date', searchFilters.dateRange.from.toISOString());
      }

      if (searchFilters.dateRange.to) {
        query = query.lte('end_date', searchFilters.dateRange.to.toISOString());
      }

      if (searchFilters.priceRange[0] > 0 || searchFilters.priceRange[1] < 200) {
        query = query.gte('hourly_rate', searchFilters.priceRange[0]).lte('hourly_rate', searchFilters.priceRange[1]);
      }

      if (searchFilters.availabilityStatus && searchFilters.availabilityStatus !== 'all') {
        query = query.eq('status', searchFilters.availabilityStatus);
      }

      // Pagination
      query = query.range(page * limit, (page + 1) * limit - 1);

      // Order by created_at
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Filter by experience years and rating in memory since these are in doctor_profiles
      let filteredData = data || [];

      if (searchFilters.experienceYears > 0) {
        filteredData = filteredData.filter(post => 
          post.doctor_profile?.experience_years && post.doctor_profile.experience_years >= searchFilters.experienceYears
        );
      }

      // Note: Rating filter would require a separate query to get average ratings from reviews table
      // For now, we'll skip this filter or implement it as a separate enhancement

      setResults(filteredData as VacationPostWithProfile[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error searching vacations:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchVacations(filters);
  }, [filters]);

  const updateFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      searchQuery: '',
      specialty: 'all',
      location: '',
      dateRange: { from: null, to: null },
      priceRange: [0, 200],
      experienceYears: 0,
      rating: 0,
      availabilityStatus: 'all'
    };
    setFilters(clearedFilters);
  };

  return {
    filters,
    results,
    loading,
    totalCount,
    updateFilters,
    clearFilters,
    searchVacations: (page?: number, limit?: number) => searchVacations(filters, page, limit)
  };
}
