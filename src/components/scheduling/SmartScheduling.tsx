import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  MapPin,
  Users,
  Star,
  Filter,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface TimeSlot {
  id: string;
  vacation_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  booking_id?: string;
  created_at: string;
  updated_at: string;
}

interface VacationEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'draft' | 'published' | 'booked' | 'completed' | 'cancelled';
  time_slots: TimeSlot[];
  bookings_count: number;
  hourly_rate: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'vacation' | 'booking' | 'break' | 'unavailable';
  status: string;
  location?: string;
  color: string;
}

interface SmartSchedulingProps {
  userId: string;
  userType: 'doctor' | 'establishment';
}

export default function SmartScheduling({ userId, userType }: SmartSchedulingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [vacations, setVacations] = useState<VacationEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Create/Edit event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    hourly_rate: 50,
    is_recurring: false,
    recurring_pattern: 'weekly',
    recurring_until: '',
    time_slots: [] as Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>
  });

  const [smartSuggestions, setSmartSuggestions] = useState<{
    optimalTimeSlots: Array<{ date: string; start_time: string; end_time: string; score: number }>;
    conflictWarnings: Array<{ message: string; severity: 'low' | 'medium' | 'high' }>;
    availabilityGaps: Array<{ date: string; duration: number }>;
  }>({
    optimalTimeSlots: [],
    conflictWarnings: [],
    availabilityGaps: []
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVacations(),
        fetchBookings(),
        fetchTimeSlots()
      ]);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du calendrier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVacations = async () => {
    const startOfCurrentMonth = startOfMonth(selectedDate);
    const endOfCurrentMonth = endOfMonth(selectedDate);

    const { data, error } = await supabase
      .from('vacation_posts')
      .select(`
        *,
        time_slots(*),
        bookings:vacation_bookings(count)
      `)
      .eq('doctor_id', userId)
      .gte('start_date', startOfCurrentMonth.toISOString())
      .lte('end_date', endOfCurrentMonth.toISOString());

    if (error) throw error;

    const vacationEvents: VacationEvent[] = data?.map(vacation => ({
      id: vacation.id,
      title: vacation.title,
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      location: vacation.location,
      status: vacation.status,
      time_slots: vacation.time_slots || [],
      bookings_count: vacation.bookings?.[0]?.count || 0,
      hourly_rate: vacation.hourly_rate
    })) || [];

    setVacations(vacationEvents);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('vacation_bookings')
      .select(`
        *,
        vacation_post:vacation_posts(title, location)
      `)
      .eq(userType === 'doctor' ? 'doctor_id' : 'establishment_id', userId);

    if (error) throw error;

    const bookingEvents: CalendarEvent[] = data?.map(booking => ({
      id: booking.id,
      title: booking.vacation_post?.title || 'Réservation',
      date: booking.start_date,
      start_time: booking.start_time || '09:00',
      end_time: booking.end_time || '17:00',
      type: 'booking',
      status: booking.status,
      location: booking.vacation_post?.location,
      color: getStatusColor(booking.status)
    })) || [];

    return bookingEvents;
  };

  const fetchTimeSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select(`
        *,
        vacation_post:vacation_posts(title, location, doctor_id)
      `)
      .eq('vacation_post.doctor_id', userId);

    if (error) throw error;

    const timeSlotEvents: CalendarEvent[] = data?.map(slot => ({
      id: slot.id,
      title: slot.vacation_post?.title || 'Créneau',
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      type: 'vacation',
      status: slot.is_available ? 'available' : 'booked',
      location: slot.vacation_post?.location,
      color: slot.is_available ? '#10b981' : '#ef4444'
    })) || [];

    setEvents(timeSlotEvents);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const generateSmartSuggestions = async (startDate: Date, endDate: Date) => {
    try {
      // Analyze existing bookings and availability
      const existingEvents = events.filter(event => {
        const eventDate = parseISO(event.date);
        return isWithinInterval(eventDate, { start: startDate, end: endDate });
      });

      // Find optimal time slots based on historical data
      const { data: popularTimes, error } = await supabase
        .from('vacation_bookings')
        .select('start_time, end_time, created_at')
        .eq('doctor_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculate optimal time slots
      const timeSlotStats: Record<string, number> = {};
      popularTimes?.forEach(booking => {
        const timeKey = `${booking.start_time}-${booking.end_time}`;
        timeSlotStats[timeKey] = (timeSlotStats[timeKey] || 0) + 1;
      });

      const optimalSlots = Object.entries(timeSlotStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([timeRange, count]) => {
          const [startTime, endTime] = timeRange.split('-');
          return {
            date: format(startDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            score: count
          };
        });

      // Detect conflicts
      const conflicts: Array<{ message: string; severity: 'low' | 'medium' | 'high' }> = [];
      
      const overlappingEvents = existingEvents.filter(event => {
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const eventEnd = new Date(`${event.date}T${event.end_time}`);
        return eventStart < endDate && eventEnd > startDate;
      });

      if (overlappingEvents.length > 0) {
        conflicts.push({
          message: `${overlappingEvents.length} événement(s) se chevauchent avec cette période`,
          severity: 'high'
        });
      }

      // Find availability gaps
      const availabilityGaps: Array<{ date: string; duration: number }> = [];
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      dateRange.forEach(date => {
        const dayEvents = existingEvents.filter(event => event.date === format(date, 'yyyy-MM-dd'));
        if (dayEvents.length === 0) {
          availabilityGaps.push({
            date: format(date, 'yyyy-MM-dd'),
            duration: 8 // 8 heures de disponibilité par défaut
          });
        }
      });

      setSmartSuggestions({
        optimalTimeSlots: optimalSlots,
        conflictWarnings: conflicts,
        availabilityGaps: availabilityGaps
      });
    } catch (error) {
      logger.error('Error generating smart suggestions:', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .insert([{
          doctor_id: userId,
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.location,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date,
          hourly_rate: eventForm.hourly_rate,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      // Create time slots
      if (eventForm.time_slots.length > 0) {
        const timeSlots = eventForm.time_slots.map(slot => ({
          vacation_id: data.id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true
        }));

        const { error: slotsError } = await supabase
          .from('time_slots')
          .insert(timeSlots);

        if (slotsError) throw slotsError;
      }

      toast({
        title: "Succès",
        description: "Événement créé avec succès"
      });

      setShowCreateDialog(false);
      setEventForm({
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        hourly_rate: 50,
        is_recurring: false,
        recurring_pattern: 'weekly',
        recurring_until: '',
        time_slots: []
      });
      fetchData();
    } catch (error: any) {
      logger.error('Error creating event:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'événement",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('vacation_posts')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Événement supprimé avec succès"
      });

      fetchData();
    } catch (error: any) {
      logger.error('Error deleting event:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'événement",
        variant: "destructive"
      });
    }
  };

  const generateTimeSlots = () => {
    if (!eventForm.start_date || !eventForm.end_date || !eventForm.start_time || !eventForm.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner toutes les dates et heures",
        variant: "destructive"
      });
      return;
    }

    const startDate = parseISO(eventForm.start_date);
    const endDate = parseISO(eventForm.end_date);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const timeSlots = dateRange.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      start_time: eventForm.start_time,
      end_time: eventForm.end_time
    }));

    setEventForm({ ...eventForm, time_slots: timeSlots });
    generateSmartSuggestions(startDate, endDate);
  };

  const exportCalendar = () => {
    const calendarData = events.map(event => ({
      Subject: event.title,
      'Start Date': event.date,
      'Start Time': event.start_time,
      'End Time': event.end_time,
      Location: event.location || '',
      Status: event.status,
      Type: event.type
    }));

    const csvContent = [
      Object.keys(calendarData[0] || {}).join(','),
      ...calendarData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter(event => 
    filterStatus === 'all' || event.status === filterStatus
  );

  const getDayEvents = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter(event => event.date === dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Chargement du calendrier...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={(value: 'month' | 'week' | 'day') => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="booked">Réservé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer un événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouvel événement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm({...eventForm, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Heure de début</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Heure de fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={eventForm.hourly_rate}
                    onChange={(e) => setEventForm({...eventForm, hourly_rate: parseInt(e.target.value)})}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring"
                    checked={eventForm.is_recurring}
                    onCheckedChange={(checked) => setEventForm({...eventForm, is_recurring: checked})}
                  />
                  <Label htmlFor="is_recurring">Événement récurrent</Label>
                </div>

                <Button 
                  type="button" 
                  onClick={generateTimeSlots}
                  className="w-full"
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Générer les créneaux automatiquement
                </Button>

                {/* Smart Suggestions */}
                {smartSuggestions.optimalTimeSlots.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Suggestions intelligentes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {smartSuggestions.optimalTimeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{slot.start_time} - {slot.end_time}</span>
                          <Badge variant="secondary">Score: {slot.score}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Conflict Warnings */}
                {smartSuggestions.conflictWarnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4 mr-2 inline" />
                        Avertissements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {smartSuggestions.conflictWarnings.map((warning, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{warning.message}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Time Slots Preview */}
                {eventForm.time_slots.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Créneaux générés ({eventForm.time_slots.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {eventForm.time_slots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                            <span>{slot.date}</span>
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.start_date}>
                  Créer l'événement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </div>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getDayEvents(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucun événement pour cette date
                  </p>
                ) : (
                  getDayEvents(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {event.start_time} - {event.end_time}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{event.type}</Badge>
                        <Badge 
                          variant={event.status === 'available' ? 'default' : 'destructive'}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'événement</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500">{selectedEvent.date}</p>
                <p className="text-sm text-gray-500">
                  {selectedEvent.start_time} - {selectedEvent.end_time}
                </p>
                {selectedEvent.location && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedEvent.location}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedEvent.type}</Badge>
                <Badge variant={selectedEvent.status === 'available' ? 'default' : 'destructive'}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
