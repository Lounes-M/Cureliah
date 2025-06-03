import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, parseISO, isWithinInterval } from 'date-fns';

export interface Availability {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  recurrence_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days_of_week?: number[];
    interval?: number;
    end_date?: string;
  };
  created_at: string;
}

export const createAvailability = async (
  doctorId: string,
  startDate: string,
  endDate: string,
  isRecurring: boolean = false,
  recurrencePattern?: Availability['recurrence_pattern']
) => {
  try {
    const { data, error } = await supabase
      .from('doctor_availability')
      .insert([
        {
          doctor_id: doctorId,
          start_date: startDate,
          end_date: endDate,
          is_recurring: isRecurring,
          recurrence_pattern: recurrencePattern
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating availability:', error);
    throw error;
  }
};

export const getAvailability = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    throw error;
  }
};

export const deleteAvailability = async (availabilityId: string) => {
  try {
    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('id', availabilityId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting availability:', error);
    throw error;
  }
};

export const checkAvailability = async (
  doctorId: string,
  startDate: string,
  endDate: string
) => {
  try {
    // Get all availability slots
    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId);

    if (error) throw error;

    // Get all booked vacations
    const { data: vacations, error: vacationError } = await supabase
      .from('vacation_posts')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'booked');

    if (vacationError) throw vacationError;

    // Check if the requested period is within any availability slot
    const isAvailable = availability?.some(slot => {
      const slotStart = parseISO(slot.start_date);
      const slotEnd = parseISO(slot.end_date);
      const requestStart = parseISO(startDate);
      const requestEnd = parseISO(endDate);

      return isWithinInterval(requestStart, { start: slotStart, end: slotEnd }) &&
             isWithinInterval(requestEnd, { start: slotStart, end: slotEnd });
    });

    // Check if the requested period overlaps with any booked vacation
    const hasConflict = vacations?.some(vacation => {
      const vacationStart = parseISO(vacation.start_date);
      const vacationEnd = parseISO(vacation.end_date);
      const requestStart = parseISO(startDate);
      const requestEnd = parseISO(endDate);

      return (
        isWithinInterval(requestStart, { start: vacationStart, end: vacationEnd }) ||
        isWithinInterval(requestEnd, { start: vacationStart, end: vacationEnd }) ||
        isWithinInterval(vacationStart, { start: requestStart, end: requestEnd })
      );
    });

    return {
      isAvailable: isAvailable && !hasConflict,
      conflicts: hasConflict ? vacations : []
    };
  } catch (error: any) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

export const generateRecurringAvailability = (
  startDate: string,
  endDate: string,
  pattern: Availability['recurrence_pattern']
) => {
  if (!pattern) return [];

  const slots: { start_date: string; end_date: string }[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const patternEnd = pattern.end_date ? parseISO(pattern.end_date) : addDays(end, 365);

  let currentDate = start;
  while (currentDate <= patternEnd) {
    if (pattern.frequency === 'daily') {
      slots.push({
        start_date: format(currentDate, 'yyyy-MM-dd'),
        end_date: format(currentDate, 'yyyy-MM-dd')
      });
      currentDate = addDays(currentDate, pattern.interval || 1);
    } else if (pattern.frequency === 'weekly' && pattern.days_of_week) {
      pattern.days_of_week.forEach(day => {
        const slotDate = addDays(currentDate, day);
        if (slotDate <= patternEnd) {
          slots.push({
            start_date: format(slotDate, 'yyyy-MM-dd'),
            end_date: format(slotDate, 'yyyy-MM-dd')
          });
        }
      });
      currentDate = addDays(currentDate, 7 * (pattern.interval || 1));
    }
  }

  return slots;
}; 