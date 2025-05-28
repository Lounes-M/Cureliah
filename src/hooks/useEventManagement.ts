
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, EventForm } from '@/types/calendar';

interface UseEventManagementProps {
  user: any;
  onEventSaved: () => void;
}

export const useEventManagement = ({ user, onEventSaved }: UseEventManagementProps) => {
  const { toast } = useToast();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'general'
  });

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      event_type: 'general'
    });
    setEditingEvent(null);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_time: format(parseISO(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(parseISO(event.end_time), "yyyy-MM-dd'T'HH:mm"),
      event_type: event.event_type
    });
    setShowEventDialog(true);
  };

  const saveEvent = async () => {
    if (!user || !eventForm.title || !eventForm.start_time || !eventForm.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const eventData = {
        user_id: user.id,
        title: eventForm.title,
        description: eventForm.description || null,
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: new Date(eventForm.end_time).toISOString(),
        event_type: eventForm.event_type
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Événement modifié avec succès"
        });
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert(eventData);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Événement créé avec succès"
        });
      }

      setShowEventDialog(false);
      resetForm();
      onEventSaved();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'événement",
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Événement supprimé avec succès"
      });

      onEventSaved();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive"
      });
    }
  };

  return {
    showEventDialog,
    setShowEventDialog,
    editingEvent,
    eventForm,
    setEventForm,
    resetForm,
    openEditDialog,
    saveEvent,
    deleteEvent
  };
};
