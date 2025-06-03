
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, TimeSlot } from '@/types/database';
import { format } from 'date-fns';
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
import { CalendarIcon, Plus } from 'lucide-react';

interface VacationCalendarProps {
  doctorId: string;
  onVacationCreated?: () => void;
  onVacationUpdated?: () => void;
}

export const VacationCalendar = ({ doctorId, onVacationCreated, onVacationUpdated }: VacationCalendarProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newVacation, setNewVacation] = useState<Partial<VacationPost>>({
    title: '',
    speciality: 'general',
    hourly_rate: 0,
    location: '',
    requirements: '',
  });
  const { toast } = useToast();

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

      const calendarEvents = vacations?.map(vacation => ({
        id: vacation.id,
        title: vacation.title,
        start: vacation.start_date,
        end: vacation.end_date,
        extendedProps: {
          speciality: vacation.speciality,
          hourly_rate: vacation.hourly_rate,
          location: vacation.location,
          requirements: vacation.requirements,
          time_slots: vacation.time_slots,
        },
        backgroundColor: getStatusColor(vacation.status),
        borderColor: getStatusColor(vacation.status),
        textColor: '#ffffff',
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
        return '#22c55e'; // green
      case 'booked':
        return '#3b82f6'; // blue
      case 'completed':
        return '#6b7280'; // gray
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start);
    setNewVacation({
      ...newVacation,
      start_date: format(selectInfo.start, 'yyyy-MM-dd'),
      end_date: format(selectInfo.end, 'yyyy-MM-dd'),
    });
    setShowCreateDialog(true);
  };

  const handleEventClick = (clickInfo: any) => {
    // Handle event click - could show details or edit dialog
    console.log('Event clicked:', clickInfo.event);
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
        speciality: 'general',
        hourly_rate: 0,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-medical-blue" />
              <CardTitle>Planifier vos vacations</CardTitle>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle vacation</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="calendar-container bg-white rounded-lg shadow-sm border">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locale="fr"
              selectable={true}
              selectMirror={true}
              dayMaxEvents={false}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="auto"
              contentHeight={600}
              aspectRatio={1.8}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="01:00:00"
              slotLabelInterval="01:00:00"
              expandRows={true}
              nowIndicator={true}
              eventDisplay="block"
              dayHeaderFormat={{ weekday: 'long', month: 'short', day: 'numeric' }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              allDaySlot={false}
              scrollTime="08:00:00"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: '07:00',
                endTime: '20:00',
              }}
              selectConstraint="businessHours"
              eventConstraint="businessHours"
              selectOverlap={false}
              eventOverlap={false}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle vacation</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={newVacation.title || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, title: e.target.value })}
                  placeholder="Ex: Consultation générale"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="speciality">Spécialité *</Label>
                <Select
                  value={newVacation.speciality || 'general'}
                  onValueChange={(value) => setNewVacation({ ...newVacation, speciality: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Médecine générale</SelectItem>
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
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Taux horaire (€) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="5"
                  value={newVacation.hourly_rate || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, hourly_rate: Number(e.target.value) })}
                  placeholder="Ex: 80"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Lieu *</Label>
                <Input
                  id="location"
                  value={newVacation.location || ''}
                  onChange={(e) => setNewVacation({ ...newVacation, location: e.target.value })}
                  placeholder="Ex: Hôpital Saint-Antoine, Paris"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requirements">Exigences particulières</Label>
              <Input
                id="requirements"
                value={newVacation.requirements || ''}
                onChange={(e) => setNewVacation({ ...newVacation, requirements: e.target.value })}
                placeholder="Ex: Expérience en urgences requise, garde de nuit..."
              />
            </div>

            {selectedDate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Date sélectionnée :</strong> {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedDate(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateVacation}
              disabled={!newVacation.title || !newVacation.location || !newVacation.hourly_rate}
            >
              Créer la vacation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
