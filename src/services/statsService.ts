import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface DoctorStats {
  total_vacations: number;
  available_vacations: number;
  booked_vacations: number;
  completed_vacations: number;
  total_earnings: number;
  average_rating: number;
  total_reviews: number;
  monthly_stats: {
    month: string;
    vacations: number;
    earnings: number;
  }[];
}

export interface EstablishmentStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  total_spent: number;
  average_rating: number;
  total_reviews: number;
  monthly_stats: {
    month: string;
    bookings: number;
    spending: number;
  }[];
}

export const getDoctorStats = async (doctorId: string): Promise<DoctorStats> => {
  try {
    // Get basic stats
    const { data: vacations, error: vacationError } = await supabase
      .from('vacation_posts')
      .select('*')
      .eq('doctor_id', doctorId);

    if (vacationError) throw vacationError;

    // Get reviews
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', doctorId)
      .eq('type', 'doctor');

    if (reviewError) throw reviewError;

    // Calculate basic stats
    const total_vacations = vacations?.length || 0;
    const available_vacations = vacations?.filter(v => v.status === 'available').length || 0;
    const booked_vacations = vacations?.filter(v => v.status === 'booked').length || 0;
    const completed_vacations = vacations?.filter(v => v.status === 'completed').length || 0;
    const total_earnings = vacations
      ?.filter(v => v.status === 'completed')
      .reduce((sum, v) => sum + (v.hourly_rate * 8 * Math.ceil((new Date(v.end_date).getTime() - new Date(v.start_date).getTime()) / (1000 * 60 * 60 * 24))), 0) || 0;
    const average_rating = reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const total_reviews = reviews?.length || 0;

    // Calculate monthly stats
    const monthly_stats = [];
    for (let i = 0; i < 6; i++) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthVacations = vacations?.filter(v => {
        const date = new Date(v.created_at);
        return date >= monthStart && date <= monthEnd;
      }) || [];

      const monthEarnings = monthVacations
        .filter(v => v.status === 'completed')
        .reduce((sum, v) => sum + (v.hourly_rate * 8 * Math.ceil((new Date(v.end_date).getTime() - new Date(v.start_date).getTime()) / (1000 * 60 * 60 * 24))), 0);

      monthly_stats.push({
        month: format(month, 'MMM yyyy'),
        vacations: monthVacations.length,
        earnings: monthEarnings
      });
    }

    return {
      total_vacations,
      available_vacations,
      booked_vacations,
      completed_vacations,
      total_earnings,
      average_rating,
      total_reviews,
      monthly_stats
    };
  } catch (error: any) {
    console.error('Error getting doctor stats:', error);
    throw error;
  }
};

export const getEstablishmentStats = async (establishmentId: string): Promise<EstablishmentStats> => {
  try {
    // Get bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('vacation_bookings')
      .select(`
        *,
        vacation_post:vacation_posts (
          hourly_rate,
          start_date,
          end_date
        )
      `)
      .eq('establishment_id', establishmentId);

    if (bookingError) throw bookingError;

    // Get reviews
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', establishmentId)
      .eq('type', 'establishment');

    if (reviewError) throw reviewError;

    // Calculate basic stats
    const total_bookings = bookings?.length || 0;
    const active_bookings = bookings?.filter(b => b.status === 'active').length || 0;
    const completed_bookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const total_spent = bookings
      ?.filter(b => b.status === 'completed')
      .reduce((sum, b) => {
        const vacation = b.vacation_post;
        const hours = Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60));
        return sum + (vacation.hourly_rate * hours);
      }, 0) || 0;
    const average_rating = reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const total_reviews = reviews?.length || 0;

    // Calculate monthly stats
    const monthly_stats = [];
    for (let i = 0; i < 6; i++) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthBookings = bookings?.filter(b => {
        const date = new Date(b.created_at);
        return date >= monthStart && date <= monthEnd;
      }) || [];

      const monthSpending = monthBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => {
          const vacation = b.vacation_post;
          const hours = Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60));
          return sum + (vacation.hourly_rate * hours);
        }, 0);

      monthly_stats.push({
        month: format(month, 'MMM yyyy'),
        bookings: monthBookings.length,
        spending: monthSpending
      });
    }

    return {
      total_bookings,
      active_bookings,
      completed_bookings,
      total_spent,
      average_rating,
      total_reviews,
      monthly_stats
    };
  } catch (error: any) {
    console.error('Error getting establishment stats:', error);
    throw error;
  }
}; 