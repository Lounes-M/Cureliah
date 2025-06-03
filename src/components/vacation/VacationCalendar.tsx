
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, TimeSlot } from '@/types/database';
import { format, addDays, startOfWeek, startOfDay, addHours, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface VacationCalendarProps {
  doctorId: string;
  onVacationCreated?: () => void;
  onVacationUpdated?: () => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  speciality: string;
  hourly_rate: number;
  location: string;
}

export const VacationCalendar = ({ doctorId, onVacationCreated, onVacationUpdated }: VacationCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [newVacation, setNewVacation] = useState<Partial<VacationPost>>({
    title: '',
    speciality: 'general_medicine',
    hourly_rate: 80,
    location: '',
    requirements: '',
  });
  const { toast } = useToast();

  // Génération des heures (6h à 22h)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  // Génération des jours de la semaine
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return addDays(weekStart, i);
  });

  useEffect(() => {
    fetchVacations();
  }, [doctorId]);

  const fetchVacations = async () => {
    try {
      const { data: vacations, error } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          time_slots(*)
        `)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = vacations?.map(vacation => ({
        id: vacation.id,
        title: vacation.title,
        start: new Date(vacation.start_date),
        end: new Date(vacation.end_date),
        status: vacation.status,
        speciality: vacation.speciality,
        hourly_rate: vacation.hourly_rate,
        location: vacation.location,
      })) || [];

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500';
      case 'booked':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({ date, hour });
    const startDateTime = addHours(startOfDay(date), hour);
    const endDateTime = addHours(startDateTime, 1);
    
    setNewVacation({
      ...newVacation,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
    });
    setShowCreateDialog(true);
  };

  const handleCreateVacation = async () => {
    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .insert([{
          ...newVacation,
          doctor_id: doctorId,
          status: 'available',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La vacation a été créée",
      });

      setShowCreateDialog(false);
      setNewVacation({
        title: '',
        speciality: 'general_medicine',
        hourly_rate: 80,
        location: '',
        requirements: '',
      });
      
      if (onVacationCreated) {
        onVacationCreated();
      }
      
      fetchVacations();
    } catch (error) {
      console.error('Error creating vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vacation",
        variant: "destructive"
      });
    }
  };

  const getEventsForSlot = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date) && eventDate.getHours() === hour;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = viewMode === 'week' ? 7 : 1;
    setCurrentDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const displayDays = viewMode === 'week' ? weekDays : [currentDate];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Planifier vos vacations
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Gérez votre planning de manière intuitive
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-lg border shadow-sm">
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="rounded-r-none"
                >
                  Semaine
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className="rounded-l-none"
                >
                  Jour
                </Button>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle vacation
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-b">
            <Button
              variant="ghost"
              onClick={() => navigateWeek('prev')}
              className="hover:bg-white shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900">
                {viewMode === 'week' ? (
                  `${format(weekDays[0], 'd MMM', { locale: fr })} - ${format(weekDays[6], 'd MMM yyyy', { locale: fr })}`
                ) : (
                  format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
                )}
              </h3>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => navigateWeek('next')}
              className="hover:bg-white shadow-sm"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Calendrier */}
          <div className="calendar-grid bg-white">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-8 border-b bg-gray-50">
              <div className="p-4 text-center text-sm font-medium text-gray-600 border-r">
                <Clock className="w-4 h-4 mx-auto" />
              </div>
              {displayDays.map((day, index) => (
                <div key={index} className={`p-4 text-center border-r last:border-r-0 ${
                  isToday(day) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}>
                  <div className="font-semibold">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-xl mt-1 ${
                    isToday(day) ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grille horaire */}
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b hover:bg-gray-50 transition-colors">
                  {/* Colonne des heures */}
                  <div className="p-3 text-center text-sm font-medium text-gray-600 border-r bg-gray-50">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {/* Colonnes des jours */}
                  {displayDays.map((day, dayIndex) => {
                    const slotEvents = getEventsForSlot(day, hour);
                    return (
                      <div
                        key={dayIndex}
                        className="relative min-h-[60px] border-r last:border-r-0 cursor-pointer hover:bg-blue-50 transition-colors group"
                        onClick={() => handleSlotClick(day, hour)}
                      >
                        {/* Indicateur hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-2 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                        
                        {/* Événements */}
                        {slotEvents.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`absolute inset-1 ${getStatusColor(event.status)} text-white rounded-lg p-2 text-xs shadow-sm`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-90 truncate">{event.location}</div>
                            <div className="text-xs opacity-80">{event.hourly_rate}€/h</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Créer une nouvelle vacation</DialogTitle>
            {selectedSlot && (
              <p className="text-sm text-gray-600">
                {format(selectedSlot.date, 'EEEE d MMMM yyyy', { locale: fr })} à {selectedSlot.hour}:00
              </p>
            )}
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={newVacation.title || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, title: e.target.value })}
                  placeholder="Ex: Consultation générale"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speciality">Spécialité *</Label>
                <Select
                  value={newVacation.speciality || 'general_medicine'}
                  onValueChange={(value) => setNewVacation({ ...newVacation, speciality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_medicine">Médecine générale</SelectItem>
                    <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                    <SelectItem value="dermatology">Dermatologie</SelectItem>
                    <SelectItem value="ophthalmology">Ophtalmologie</SelectItem>
                    <SelectItem value="cardiology">Cardiologie</SelectItem>
                    <SelectItem value="psychiatry">Psychiatrie</SelectItem>
                    <SelectItem value="orthopedics">Orthopédie</SelectItem>
                    <SelectItem value="gynecology">Gynécologie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Taux horaire (€) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="5"
                  value={newVacation.hourly_rate || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, hourly_rate: Number(e.target.value) })}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu *</Label>
                <Input
                  id="location"
                  value={newVacation.location || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, location: e.target.value })}
                  placeholder="Ex: Hôpital Saint-Antoine, Paris"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Exigences particulières</Label>
              <Input
                id="requirements"
                value={newVacation.requirements || ''}
                onChange={(e) => setNewVacation({ ...newVacation, requirements: e.target.value })}
                placeholder="Ex: Expérience en urgences requise..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedSlot(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateVacation}
              disabled={!newVacation.title || !newVacation.location || !newVacation.hourly_rate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Créer la vacation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
