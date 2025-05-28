
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
      
      // First, get all vacation bookings for the user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          vacation_post_id,
          establishment_id,
          doctor_id,
          status,
          created_at
        `)
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

      // Get vacation post IDs
      const vacationPostIds = bookingsData.map(booking => booking.vacation_post_id);

      // Fetch vacation posts with establishment profiles
      const { data: vacationPostsData, error: vacationPostsError } = await supabase
        .from('vacation_posts')
        .select(`
          id,
          title,
          start_date,
          end_date,
          location,
          speciality,
          doctor_id
        `)
        .in('id', vacationPostIds);

      if (vacationPostsError) {
        console.error('Error fetching vacation posts:', vacationPostsError);
        throw vacationPostsError;
      }

      console.log('Vacation posts data:', vacationPostsData);

      // Get establishment profiles
      const establishmentIds = bookingsData.map(booking => booking.establishment_id);
      const { data: establishmentProfilesData, error: establishmentProfilesError } = await supabase
        .from('establishment_profiles')
        .select('id, name')
        .in('id', establishmentIds);

      if (establishmentProfilesError) {
        console.error('Error fetching establishment profiles:', establishmentProfilesError);
        throw establishmentProfilesError;
      }

      console.log('Establishment profiles data:', establishmentProfilesData);

      // Combine the data
      const transformedData: VacationBooking[] = bookingsData.map(booking => {
        const vacationPost = vacationPostsData?.find(post => post.id === booking.vacation_post_id);
        const establishmentProfile = establishmentProfilesData?.find(profile => profile.id === booking.establishment_id);

        return {
          ...booking,
          vacation_posts: vacationPost || {
            title: 'Vacation inconnue',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            location: null,
            speciality: null
          },
          establishment_profiles: establishmentProfile || {
            name: 'Établissement inconnu'
          }
        };
      });

      console.log('Final transformed vacation bookings:', transformedData);

      // Filter by date range
      const startOfMonth = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const endOfMonth = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const filteredData = transformedData.filter(booking => {
        const startDate = new Date(booking.vacation_posts.start_date);
        const endDate = new Date(booking.vacation_posts.end_date);
        return startDate <= endOfMonth && endDate >= startOfMonth;
      });

      console.log('Filtered vacation bookings:', filteredData);
      setVacationBookings(filteredData);
    } catch (error: any) {
      console.error('Error fetching vacation bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations réservées",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      if (profile?.user_type === 'doctor') {
        fetchVacationBookings();
      } else {
        setLoading(false);
      }
    }
  }, [user, profile, selectedDate]);

  return {
    events,
    vacationBookings,
    loading,
    refetchEvents: fetchEvents
  };
};
