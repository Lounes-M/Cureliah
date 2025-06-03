import { useState, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, VacationBooking } from '@/types/calendar';

interface UseCalendarDataProps {
  user: any;
  profile: any;
  selectedDate: Date;
}

export const useCalendarData = ({ user, profile, selectedDate }: UseCalendarDataProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [vacationBookings, setVacationBookings] = useState<VacationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacations, setVacations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const startOfMonth = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const endOfMonth = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfMonth.toISOString())
        .lte('end_time', endOfMonth.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive"
      });
    }
  };

  const fetchVacationBookings = async () => {
    if (!user) return;

    try {
      console.log('Fetching vacation bookings for user:', user.id);
      
      // Fetch vacation bookings where the user is the doctor
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select('*')
        .eq('doctor_id', user.id)
        .in('status', ['booked', 'completed']);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('Raw bookings data:', bookingsData);

      if (!bookingsData || bookingsData.length === 0) {
        console.log('No vacation bookings found');
        setVacationBookings([]);
        return;
      }

      // Get vacation post IDs from the bookings
      const vacationPostIds = [...new Set(bookingsData.map(booking => booking.vacation_post_id))];
      
      // Fetch vacation posts
      const { data: vacationPostsData, error: vacationPostsError } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles (
            bio,
            experience_years,
            license_number
          ),
          profiles (
            first_name,
            last_name
          ),
          time_slots (*)
        `)
        .in('id', vacationPostIds);

      if (vacationPostsError) {
        console.error('Error fetching vacation posts:', vacationPostsError);
        throw vacationPostsError;
      }

      console.log('Vacation posts data:', vacationPostsData);

      // Get establishment IDs from the bookings
      const establishmentIds = [...new Set(bookingsData.map(booking => booking.establishment_id))];
      
      // Fetch establishment profiles
      const { data: establishmentProfilesData, error: establishmentProfilesError } = await supabase
        .from('establishment_profiles')
        .select('id, name')
        .in('id', establishmentIds);

      if (establishmentProfilesError) {
        console.error('Error fetching establishment profiles:', establishmentProfilesError);
        // Continue without establishment data rather than failing completely
      }

      console.log('Establishment profiles data:', establishmentProfilesData);

      // Combine the data into the expected format
      const transformedData: VacationBooking[] = bookingsData.map(booking => {
        const vacationPost = vacationPostsData?.find(post => post.id === booking.vacation_post_id);
        const establishmentProfile = establishmentProfilesData?.find(profile => profile.id === booking.establishment_id);

        return {
          id: booking.id,
          vacation_post_id: booking.vacation_post_id,
          establishment_id: booking.establishment_id,
          doctor_id: booking.doctor_id,
          status: booking.status,
          created_at: booking.created_at,
          vacation_posts: vacationPost ? {
            title: vacationPost.title,
            start_date: vacationPost.start_date,
            end_date: vacationPost.end_date,
            location: vacationPost.location,
            speciality: vacationPost.speciality
          } : {
            title: 'Vacation inconnue',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            location: null,
            speciality: null
          },
          establishment_profiles: {
            name: establishmentProfile?.name || 'Établissement inconnu'
          }
        };
      });

      console.log('Final transformed vacation bookings:', transformedData);

      // Filter by date range for the current month
      const startOfMonth = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const endOfMonth = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const filteredData = transformedData.filter(booking => {
        const startDate = new Date(booking.vacation_posts.start_date);
        const endDate = new Date(booking.vacation_posts.end_date);
        return startDate <= endOfMonth && endDate >= startOfMonth;
      });

      console.log('Filtered vacation bookings for current month:', filteredData);
      setVacationBookings(filteredData);
    } catch (error: any) {
      console.error('Error fetching vacation bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations réservées",
        variant: "destructive"
      });
    }
  };

  const fetchVacations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles (
            bio,
            experience_years,
            license_number
          ),
          profiles (
            first_name,
            last_name
          ),
          time_slots (*)
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedVacations = data?.map(vacation => ({
        ...vacation,
        start: new Date(vacation.start_date),
        end: new Date(vacation.end_date),
        title: vacation.title,
        description: vacation.description,
        location: vacation.location,
        speciality: vacation.speciality,
        doctor: vacation.profiles ? `${vacation.profiles.first_name} ${vacation.profiles.last_name}` : 'Médecin inconnu',
        time_slots: vacation.time_slots
      })) || [];

      setVacations(formattedVacations);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      setError('Erreur lors du chargement des vacations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        await fetchEvents();
        
        if (profile?.user_type === 'doctor') {
          await fetchVacationBookings();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile, selectedDate]);

  return {
    events,
    vacationBookings,
    loading,
    refetchEvents: fetchEvents
  };
};
