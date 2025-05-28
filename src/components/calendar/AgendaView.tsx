
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent, VacationBooking } from '@/types/calendar';
import { getEventsForDate, getVacationBookingsForDate } from '@/utils/calendarUtils';
import VacationBookingCard from './VacationBookingCard';
import EventCard from './EventCard';

interface AgendaViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  vacationBookings: VacationBooking[];
  loading: boolean;
  readonly?: boolean;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
}

const AgendaView = ({
  selectedDate,
  events,
  vacationBookings,
  loading,
  readonly = false,
  onEditEvent,
  onDeleteEvent
}: AgendaViewProps) => {
  const dayEvents = getEventsForDate(events, selectedDate);
  const dayVacations = getVacationBookingsForDate(vacationBookings, selectedDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>
            Agenda du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : dayEvents.length === 0 && dayVacations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun événement ni vacation pour cette date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vacation Bookings */}
            {dayVacations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Vacations réservées
                </h4>
                <div className="space-y-3">
                  {dayVacations.map((vacation) => (
                    <VacationBookingCard key={vacation.id} vacation={vacation} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Events */}
            {dayEvents.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-3 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Événements
                </h4>
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      readonly={readonly}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaView;
