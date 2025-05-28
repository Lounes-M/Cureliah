
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
      const startOfMonth = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const endOfMonth = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const { data, error } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          vacation_post_id,
          establishment_id,
          doctor_id,
          status,
          created_at,
          vacation_posts (
            title,
            start_date,
            end_date,
            location,
            speciality
          ),
          establishment_profiles (
            name
          )
        `)
        .eq('doctor_id', user.id)
        .in('status', ['booked', 'completed'])
        .gte('vacation_posts.start_date', startOfMonth.toISOString())
        .lte('vacation_posts.end_date', endOfMonth.toISOString());

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: VacationBooking[] = (data || []).map(item => ({
        ...item,
        vacation_posts: Array.isArray(item.vacation_posts) ? item.vacation_posts[0] : item.vacation_posts,
        establishment_profiles: Array.isArray(item.establishment_profiles) ? item.establishment_profiles[0] : item.establishment_profiles
      }));
      
      setVacationBookings(transformedData);
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
