
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent, VacationBooking } from '@/types/calendar';
import { getAllDatesWithItems } from '@/utils/calendarUtils';
import EventDialog from './EventDialog';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  vacationBookings: VacationBooking[];
  readonly?: boolean;
  eventDialogProps: any;
}

const CalendarView = ({
  selectedDate,
  onSelectDate,
  events,
  vacationBookings,
  readonly = false,
  eventDialogProps
}: CalendarViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>Calendrier</span>
          </div>
          <EventDialog {...eventDialogProps} readonly={readonly} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={fr}
          className="w-full"
          modifiers={{
            hasItems: (date) => getAllDatesWithItems(events, vacationBookings).some(d => isSameDay(d, date))
          }}
          modifiersStyles={{
            hasItems: {
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              fontWeight: 'bold'
            }
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarView;
