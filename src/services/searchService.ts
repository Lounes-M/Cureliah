import { supabase } from '@/integrations/supabase/client';
import { VacationPost } from './vacationService';
import { Profile } from './profileService';

export interface SearchFilters {
  speciality?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  minRate?: number;
  maxRate?: number;
  availability?: 'immediate' | 'upcoming';
  rating?: number;
  languages?: string[];
  certifications?: string[];
}

export interface SearchResult {
  vacations: VacationPost[];
  doctors: Profile[];
  total: number;
}

export const searchVacations = async (filters: SearchFilters): Promise<SearchResult> => {
  try {
    let query = supabase
      .from('vacation_posts')
      .select(`
        *,
        doctor:profiles!vacation_posts_doctor_id_fkey (
          id,
          first_name,
          last_name,
          speciality,
          languages,
          certifications,
          profile_picture_url,
          rating
        ),
        establishment:profiles!vacation_posts_establishment_id_fkey (
          id,
          first_name,
          last_name,
          address,
          city,
          country,
          profile_picture_url
        )
      `)
      .eq('status', 'available');

    // Apply filters
    if (filters.speciality) {
      query = query.eq('doctor.speciality', filters.speciality);
    }

    if (filters.location) {
      query = query.ilike('establishment.city', `%${filters.location}%`);
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate.toISOString());
    }

    if (filters.minRate) {
      query = query.gte('hourly_rate', filters.minRate);
    }

    if (filters.maxRate) {
      query = query.lte('hourly_rate', filters.maxRate);
    }

    if (filters.availability === 'immediate') {
      const now = new Date();
      query = query.lte('start_date', now.toISOString());
    }

    if (filters.rating) {
      query = query.gte('doctor.rating', filters.rating);
    }

    if (filters.languages?.length) {
      query = query.contains('doctor.languages', filters.languages);
    }

    if (filters.certifications?.length) {
      query = query.contains('doctor.certifications', filters.certifications);
    }

    const { data: vacations, error, count } = await query;

    if (error) throw error;

    // Get unique doctors from the results
    const doctorIds = [...new Set(vacations.map(v => v.doctor.id))];
    const { data: doctors } = await supabase
      .from('profiles')
      .select('*')
      .in('id', doctorIds)
      .eq('role', 'doctor');

    return {
      vacations,
      doctors: doctors || [],
      total: count || 0
    };
  } catch (error: any) {
    console.error('Error searching vacations:', error);
    throw error;
  }
};

export const getSpecialities = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('speciality')
      .eq('role', 'doctor')
      .not('speciality', 'is', null);

    if (error) throw error;

    return [...new Set(data.map(d => d.speciality))];
  } catch (error: any) {
    console.error('Error fetching specialities:', error);
    throw error;
  }
};

export const getLocations = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('city')
      .eq('role', 'establishment')
      .not('city', 'is', null);

    if (error) throw error;

    return [...new Set(data.map(d => d.city))];
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}; 