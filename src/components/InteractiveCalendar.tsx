
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useEventManagement } from '@/hooks/useEventManagement';
import CalendarView from '@/components/calendar/CalendarView';
import AgendaView from '@/components/calendar/AgendaView';

interface InteractiveCalendarProps {
  initialDate?: Date;
  readonly?: boolean;
}

const InteractiveCalendar = ({ initialDate, readonly = false }: InteractiveCalendarProps) => {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  const { events, vacationBookings, loading, refetchEvents } = useCalendarData({
    user,
    profile,
    selectedDate
  });

  const eventManagement = useEventManagement({
    user,
    onEventSaved: refetchEvents
  });

  const eventDialogProps = {
    open: eventManagement.showEventDialog,
    onOpenChange: eventManagement.setShowEventDialog,
    eventForm: eventManagement.eventForm,
    setEventForm: eventManagement.setEventForm,
    editingEvent: eventManagement.editingEvent,
    onSave: eventManagement.saveEvent,
    onReset: eventManagement.resetForm
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={events}
        vacationBookings={vacationBookings}
        readonly={readonly}
        eventDialogProps={eventDialogProps}
      />

      <AgendaView
        selectedDate={selectedDate}
        events={events}
        vacationBookings={vacationBookings}
        loading={loading}
        readonly={readonly}
        onEditEvent={eventManagement.openEditDialog}
        onDeleteEvent={eventManagement.deleteEvent}
      />
    </div>
  );
};

export default InteractiveCalendar;
