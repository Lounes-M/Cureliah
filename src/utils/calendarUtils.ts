
import { parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { CalendarEvent, VacationBooking, EventType } from '@/types/calendar';

export const eventTypes: EventType[] = [
  { value: 'general', label: 'Général', color: 'bg-blue-500' },
  { value: 'vacation', label: 'Vacation', color: 'bg-green-500' },
  { value: 'meeting', label: 'Rendez-vous', color: 'bg-purple-500' },
  { value: 'break', label: 'Pause', color: 'bg-yellow-500' },
  { value: 'training', label: 'Formation', color: 'bg-orange-500' }
];

export const getEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event =>
    isSameDay(parseISO(event.start_time), date)
  );
};

export const getVacationBookingsForDate = (bookings: VacationBooking[], date: Date): VacationBooking[] => {
  return bookings.filter(booking => {
    const startDate = parseISO(booking.vacation_posts.start_date);
    const endDate = parseISO(booking.vacation_posts.end_date);
    return date >= startOfDay(startDate) && date <= endOfDay(endDate);
  });
};

export const getAllDatesWithItems = (events: CalendarEvent[], vacationBookings: VacationBooking[]): Date[] => {
  const datesWithEvents = events.map(event => startOfDay(parseISO(event.start_time)));
  const datesWithVacations = vacationBookings.flatMap(booking => {
    const dates = [];
    const start = startOfDay(parseISO(booking.vacation_posts.start_date));
    const end = endOfDay(parseISO(booking.vacation_posts.end_date));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  });

  return [...datesWithEvents, ...datesWithVacations];
};

export const getEventTypeColor = (type: string): string => {
  const eventType = eventTypes.find(t => t.value === type);
  return eventType?.color || 'bg-gray-500';
};

export const getEventTypeLabel = (type: string): string => {
  const eventType = eventTypes.find(t => t.value === type);
  return eventType?.label || type;
};

export const getVacationStatusColor = (status: string): string => {
  switch (status) {
    case 'booked':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const getVacationStatusLabel = (status: string): string => {
  switch (status) {
    case 'booked':
      return 'Réservée';
    case 'completed':
      return 'Terminée';
    default:
      return status;
  }
};
