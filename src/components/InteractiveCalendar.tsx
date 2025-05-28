
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  event_type: string;
  booking_id: string | null;
  created_at: string;
}

interface InteractiveCalendarProps {
  initialDate?: Date;
  readonly?: boolean;
}

const InteractiveCalendar = ({ initialDate, readonly = false }: InteractiveCalendarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'general'
  });

  const eventTypes = [
    { value: 'general', label: 'Général', color: 'bg-blue-500' },
    { value: 'vacation', label: 'Vacation', color: 'bg-green-500' },
    { value: 'meeting', label: 'Rendez-vous', color: 'bg-purple-500' },
    { value: 'break', label: 'Pause', color: 'bg-yellow-500' },
    { value: 'training', label: 'Formation', color: 'bg-orange-500' }
  ];

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, selectedDate]);

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
    } finally {
      setLoading(false);
    }
  };

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
      fetchEvents();
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

      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive"
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      isSameDay(parseISO(event.start_time), date)
    );
  };

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.color || 'bg-gray-500';
  };

  const getEventTypeLabel = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.label || type;
  };

  const dayEvents = getEventsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendrier</span>
            </div>
            {!readonly && (
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvel événement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Titre de l'événement"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    />
                    
                    <Textarea
                      placeholder="Description (optionnel)"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      rows={3}
                    />

                    <Select
                      value={eventForm.event_type}
                      onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type d'événement" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Début</label>
                        <Input
                          type="datetime-local"
                          value={eventForm.start_time}
                          onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fin</label>
                        <Input
                          type="datetime-local"
                          value={eventForm.end_time}
                          onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={saveEvent} className="flex-1">
                        {editingEvent ? 'Modifier' : 'Créer'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={fr}
            className="w-full"
            modifiers={{
              hasEvents: (date) => getEventsForDate(date).length > 0
            }}
            modifiersStyles={{
              hasEvents: {
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Events for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>
              Événements du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : dayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun événement pour cette date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`} />
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-700">{event.description}</p>
                      )}
                    </div>

                    {!readonly && (
                      <div className="flex space-x-1 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveCalendar;
