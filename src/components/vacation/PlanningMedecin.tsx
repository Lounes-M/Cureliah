import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, TimeSlot, Speciality } from '@/types/database';
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import '@/styles/calendar.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, User, Clock, Repeat, Trash2 } from 'lucide-react';
import { SPECIALITIES } from '@/utils/specialities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface PlanningMedecinProps {
  doctorId: string;
  onSlotCreated?: () => void;
  onSlotUpdated?: () => void;
}

interface TimeSlotEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    status: 'available' | 'booked';
    location: string;
    actType: string;
    rate: number;
    speciality: Speciality;
    description: string;
    requirements: string;
    type: string;
    isRecurring: boolean;
    vacationId: string;
  };
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
type RecurrenceEndType = 'never' | 'count' | 'date';

interface RecurrenceSettings {
  type: RecurrenceType;
  endType: RecurrenceEndType;
  count?: number;
  endDate?: string;
}

interface VacationPostData {
  id: string;
  title: string;
  description: string;
  speciality: Speciality;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location: string;
  requirements: string;
  status: 'available' | 'booked';
  act_type: 'consultation' | 'urgence' | 'visite' | 'teleconsultation';
}

interface TimeSlotData {
  id: string;
  type: 'morning' | 'afternoon' | 'custom';
  start_time: string | null;
  end_time: string | null;
  vacation_id: string;
  vacation_posts: VacationPostData;
}

export const PlanningMedecin = ({ doctorId, onSlotCreated, onSlotUpdated }: PlanningMedecinProps) => {
  const [events, setEvents] = useState<TimeSlotEvent[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Partial<VacationPost & TimeSlot>>({
    title: '',
    description: '',
    speciality: 'general_medicine',
    start_time: '',
    end_time: '',
    location: '',
    act_type: 'consultation',
    rate: 0,
    requirements: '',
  });
  const [recurrenceSettings, setRecurrenceSettings] = useState<RecurrenceSettings>({
    type: 'none',
    endType: 'never',
  });
  const [selectedDate, setSelectedDate] = useState<{ start: Date; end: Date } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimeSlotEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeSlots();
  }, [doctorId]);

  const fetchTimeSlots = async () => {
    try {
      console.log('Fetching time slots for doctor:', doctorId);

      // Examiner la structure de la table vacation_posts
      const { data: vacationStructure, error: structureError } = await supabase
        .from('vacation_posts')
        .select('*')
        .limit(1);

      if (structureError) {
        console.error('Error fetching vacation structure:', structureError);
      } else {
        console.log('Vacation posts structure:', vacationStructure);
      }

      // D'abord, récupérer les vacations du médecin
      const { data: vacations, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select('id')
        .eq('doctor_id', doctorId);

      if (vacationsError) {
        console.error('Error fetching vacations:', vacationsError);
        throw vacationsError;
      }

      console.log('Found vacations:', vacations);

      if (!vacations || vacations.length === 0) {
        console.log('No vacations found');
        setEvents([]);
        return;
      }

      // Traiter les vacations par lots de 50
      const BATCH_SIZE = 50;
      const allSlots = [];
      
      for (let i = 0; i < vacations.length; i += BATCH_SIZE) {
        const batch = vacations.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(vacations.length/BATCH_SIZE)}`);
        
        const { data: slots, error: slotsError } = await supabase
          .from('time_slots')
          .select(`
            id,
            type,
            start_time,
            end_time,
            vacation_id,
            vacation_posts (
              id,
              title,
              description,
              speciality,
              start_date,
              end_date,
              hourly_rate,
              location,
              requirements,
              status,
              act_type
            )
          `)
          .in('vacation_id', batch.map(v => v.id));

        if (slotsError) {
          console.error('Error fetching slots batch:', slotsError);
          throw slotsError;
        }

        if (slots) {
          allSlots.push(...slots);
        }
      }

      console.log('Found total slots:', allSlots.length);

      const calendarEvents = allSlots.map(slot => {
        const vacationPost = Array.isArray(slot.vacation_posts) 
          ? slot.vacation_posts[0] as VacationPostData
          : slot.vacation_posts as VacationPostData;

        if (!vacationPost) {
          console.warn('Slot without vacation_posts:', slot);
          return null;
        }

        // Déterminer les heures de début et de fin en fonction du type de créneau
        let startTime, endTime;
        
        if (slot.type === 'morning') {
          startTime = '08:00:00';
          endTime = '12:00:00';
        } else if (slot.type === 'afternoon') {
          startTime = '14:00:00';
          endTime = '18:00:00';
        } else if (slot.type === 'custom') {
          if (!slot.start_time || !slot.end_time) {
            console.warn('Custom time slot has invalid dates:', slot);
            return null;
          }
          startTime = slot.start_time;
          endTime = slot.end_time;
        } else {
          console.warn('Unknown time slot type:', slot);
          return null;
        }

        try {
          // Créer la date complète en combinant la date de la vacation avec l'heure du créneau
          const startDate = new Date(vacationPost.start_date);
          const endDate = new Date(vacationPost.end_date);
          
          const [startHours, startMinutes] = startTime.split(':');
          const [endHours, endMinutes] = endTime.split(':');
          
          startDate.setHours(parseInt(startHours), parseInt(startMinutes));
          endDate.setHours(parseInt(endHours), parseInt(endMinutes));

          return {
            id: slot.id,
            title: vacationPost.title || 'Vacation',
            start: startDate,
            end: endDate,
            extendedProps: {
              status: vacationPost.status || 'available',
              location: vacationPost.location || '',
              actType: vacationPost.act_type || 'consultation',
              rate: vacationPost.hourly_rate || 0,
              speciality: vacationPost.speciality || 'general_medicine',
              description: vacationPost.description || '',
              requirements: vacationPost.requirements || '',
              type: slot.type,
              isRecurring: false,
              vacationId: vacationPost.id,
            },
            backgroundColor: vacationPost.status === 'booked' ? '#22c55e' : '#e2e8f0',
            borderColor: vacationPost.status === 'booked' ? '#16a34a' : '#cbd5e1',
            textColor: vacationPost.status === 'booked' ? '#ffffff' : '#1e293b',
          };
        } catch (error) {
          console.error('Error processing slot:', error, slot);
          return null;
        }
      }).filter(Boolean) || [];

      console.log('Processed calendar events:', calendarEvents);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux",
        variant: "destructive"
      });
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setSelectedSlot({
      title: '',
      description: '',
      speciality: 'general_medicine',
      start_time: format(selectInfo.start, "yyyy-MM-dd'T'HH:mm:ss"),
      end_time: format(selectInfo.end, "yyyy-MM-dd'T'HH:mm:ss"),
      location: '',
      act_type: 'consultation',
      rate: 0,
      requirements: '',
    });
    setShowCreateDialog(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    console.log('Event clicked:', event);
    console.log('Event extended props:', event.extendedProps);
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps
    });
    setShowDeleteDialog(true);
  };

  const handleCreateSlot = async () => {
    try {
      if (!selectedDate) return;

      // Fermer le modal avant de commencer la création
      setShowCreateDialog(false);

      const dates: { start: Date; end: Date }[] = [];
      
      // Générer les dates en fonction des paramètres de récurrence
      if (recurrenceSettings.type === 'none') {
        dates.push(selectedDate);
      } else {
        let currentDate = new Date(selectedDate.start);
        const endDate = recurrenceSettings.endType === 'date' 
          ? new Date(recurrenceSettings.endDate!) 
          : recurrenceSettings.endType === 'count'
            ? addDays(currentDate, recurrenceSettings.count! * (recurrenceSettings.type === 'daily' ? 1 : recurrenceSettings.type === 'weekly' ? 7 : 30))
            : addMonths(currentDate, 12); // Par défaut, 1 an de récurrence

        while (currentDate <= endDate) {
          dates.push({
            start: new Date(currentDate),
            end: new Date(currentDate.getTime() + (selectedDate.end.getTime() - selectedDate.start.getTime()))
          });

          switch (recurrenceSettings.type) {
            case 'daily':
              currentDate = addDays(currentDate, 1);
              break;
            case 'weekly':
              currentDate = addWeeks(currentDate, 1);
              break;
            case 'monthly':
              currentDate = addMonths(currentDate, 1);
              break;
          }
        }
      }

      // Créer les vacations pour chaque date
      let createdCount = 0;
      const createdVacations = [];

      for (const date of dates) {
        // Créer la vacation
        const { data: vacation, error: vacationError } = await supabase
          .from('vacation_posts')
          .insert([{
            doctor_id: doctorId,
            title: selectedSlot.title || 'Disponibilité',
            description: selectedSlot.description || 'Disponibilité récurrente',
            speciality: selectedSlot.speciality,
            start_date: format(date.start, "yyyy-MM-dd'T'HH:mm:ss"),
            end_date: format(date.end, "yyyy-MM-dd'T'HH:mm:ss"),
            hourly_rate: selectedSlot.rate || 0,
            location: selectedSlot.location || '',
            requirements: selectedSlot.requirements || '',
            status: 'available',
            act_type: selectedSlot.act_type,
          }])
          .select()
          .single();

        if (vacationError) throw vacationError;
        if (vacation) createdVacations.push(vacation);

        // Déterminer le type de créneau
        const startTime = date.start;
        const endTime = date.end;
        let slotType: 'morning' | 'afternoon' | 'custom' = 'custom';

        if (startTime.getHours() === 8 && endTime.getHours() === 12) {
          slotType = 'morning';
        } else if (startTime.getHours() === 14 && endTime.getHours() === 18) {
          slotType = 'afternoon';
        }

        // Extraire uniquement l'heure pour les créneaux custom
        let startTimeStr = null;
        let endTimeStr = null;
        
        if (slotType === 'custom') {
          startTimeStr = startTime.toTimeString().slice(0, 8);
          endTimeStr = endTime.toTimeString().slice(0, 8);
        }

        // Créer le time slot
        const { error: slotError } = await supabase
          .from('time_slots')
          .insert([{
            vacation_id: vacation.id,
            type: slotType,
            start_time: startTimeStr,
            end_time: endTimeStr,
          }]);

        if (slotError) throw slotError;
        createdCount++;
      }

      // Réinitialiser le formulaire
      setSelectedSlot({
        title: '',
        description: '',
        speciality: 'general_medicine',
        start_time: '',
        end_time: '',
        location: '',
        act_type: 'consultation',
        rate: 0,
        requirements: '',
      });
      setRecurrenceSettings({
        type: 'none',
        endType: 'never',
      });
      setSelectedDate(null);

      // Rafraîchir les données
      if (onSlotCreated) {
        onSlotCreated();
      }

      // Rafraîchir le planning immédiatement
      await fetchTimeSlots();

      // Afficher le message de succès
      toast({
        title: "Succès",
        description: `Les disponibilités ont été créées (${createdCount} créneaux)`,
      });

      // Faire défiler vers le planning
      const planningElement = document.querySelector('.fc-view-harness');
      if (planningElement) {
        planningElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (error) {
      console.error('Error creating time slots:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les disponibilités",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSlot = async (deleteAll: boolean) => {
    try {
      if (!selectedEvent) return;

      if (deleteAll) {
        // Récupérer d'abord la vacation actuelle pour avoir ses détails
        const { data: currentVacation, error: vacationError } = await supabase
          .from('vacation_posts')
          .select('*')
          .eq('id', selectedEvent.extendedProps.vacationId)
          .single();

        if (vacationError) throw vacationError;

        if (currentVacation) {
          // Récupérer tous les time slots similaires
          const { data: similarSlots, error: slotsError } = await supabase
            .from('time_slots')
            .select(`
              id,
              type,
              start_time,
              end_time,
              vacation_posts (
                id,
                title,
                speciality,
                act_type
              )
            `)
            .eq('type', selectedEvent.extendedProps.type)
            .eq('start_time', selectedEvent.extendedProps.type === 'custom' ? format(selectedEvent.start, 'HH:mm:ss') : null)
            .eq('end_time', selectedEvent.extendedProps.type === 'custom' ? format(selectedEvent.end, 'HH:mm:ss') : null);

          if (slotsError) throw slotsError;

          if (similarSlots) {
            // Filtrer les vacations qui correspondent exactement
            const vacationIds = similarSlots
              .filter(slot => {
                const vacation = slot.vacation_posts;
                return vacation &&
                  vacation.title === currentVacation.title &&
                  vacation.speciality === currentVacation.speciality &&
                  vacation.act_type === currentVacation.act_type;
              })
              .map(slot => slot.vacation_posts.id);

            if (vacationIds.length > 0) {
              // Supprimer les vacations correspondantes
              const { error: deleteError } = await supabase
                .from('vacation_posts')
                .delete()
                .in('id', vacationIds);

              if (deleteError) throw deleteError;
            }
          }
        }
      } else {
        // Supprimer uniquement ce créneau
        const { error: slotError } = await supabase
          .from('time_slots')
          .delete()
          .eq('id', selectedEvent.id);

        if (slotError) throw slotError;

        // Supprimer la vacation associée si c'est le dernier créneau
        const { data: remainingSlots, error: countError } = await supabase
          .from('time_slots')
          .select('id')
          .eq('vacation_id', selectedEvent.extendedProps.vacationId);

        if (countError) throw countError;

        if (!remainingSlots || remainingSlots.length === 0) {
          const { error: vacationError } = await supabase
            .from('vacation_posts')
            .delete()
            .eq('id', selectedEvent.extendedProps.vacationId);

          if (vacationError) throw vacationError;
        }
      }

      toast({
        title: "Succès",
        description: deleteAll ? "Toutes les occurrences similaires ont été supprimées" : "Le créneau a été supprimé",
      });

      setShowDeleteDialog(false);
      setSelectedEvent(null);
      
      if (onSlotUpdated) {
        onSlotUpdated();
      }
      
      fetchTimeSlots();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le créneau",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-[800px] bg-white rounded-2xl shadow-xl flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white via-gray-50 to-white">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Mon Planning</h2>
          <Button
            onClick={() => {
              setSelectedDate(null);
              setShowCreateDialog(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-medical-blue to-blue-600 hover:from-blue-600 hover:to-medical-blue text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl px-4 py-2"
          >
            <Calendar className="w-4 h-4" />
            Ajouter une vacation
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            locale="fr"
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="100%"
            slotMinTime="08:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            expandRows={true}
            stickyHeaderDates={true}
            stickyFooterScrollbar={true}
            eventContent={(eventInfo) => (
              <div className={`flex items-center gap-2 p-2 rounded-xl ${
                eventInfo.event.extendedProps.status === 'booked' 
                  ? 'bg-gradient-to-r from-green-50 via-green-100 to-green-50 text-green-800 border border-green-200 shadow-sm hover:shadow-md' 
                  : 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm hover:shadow-md'
              } transition-all duration-300 backdrop-blur-sm`}>
                {eventInfo.event.extendedProps.status === 'booked' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{eventInfo.event.title}</span>
                  <span className="text-xs text-gray-600">
                    {format(eventInfo.event.start, 'HH:mm')} - {format(eventInfo.event.end, 'HH:mm')}
                  </span>
                </div>
              </div>
            )}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              omitZeroMinute: true
            }}
            dayHeaderFormat={{
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            }}
            nowIndicator={true}
            eventClassNames={(eventInfo) => 
              eventInfo.event.extendedProps.status === 'booked' ? 'fc-event-booked' : ''
            }
            selectConstraint="businessHours"
            selectOverlap={false}
            eventOverlap={false}
            eventConstraint="businessHours"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              startTime: '08:00',
              endTime: '24:00',
            }}
            scrollTime="08:00:00"
            scrollTimeReset={false}
            handleWindowResize={true}
            windowResizeDelay={100}
            contentHeight="auto"
            aspectRatio={1.8}
            buttonText={{
              today: "Aujourd'hui",
              week: 'Semaine',
              day: 'Jour'
            }}
          />
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la vacation</DialogTitle>
            <DialogDescription>
              Informations détaillées sur cette vacation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent?.title}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    {selectedEvent && format(selectedEvent.start, 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedEvent && `${format(selectedEvent.start, 'HH:mm')} - ${format(selectedEvent.end, 'HH:mm')}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Spécialité</span>
                    <p className="text-sm text-gray-600">
                      {SPECIALITIES[selectedEvent?.extendedProps.speciality]?.label || selectedEvent?.extendedProps.speciality}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Type d'acte</span>
                    <p className="text-sm text-gray-600">
                      {selectedEvent?.extendedProps.actType === 'consultation' && 'Consultation'}
                      {selectedEvent?.extendedProps.actType === 'urgence' && 'Urgence'}
                      {selectedEvent?.extendedProps.actType === 'visite' && 'Visite à domicile'}
                      {selectedEvent?.extendedProps.actType === 'teleconsultation' && 'Téléconsultation'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Localisation</span>
                    <p className="text-sm text-gray-600">{selectedEvent?.extendedProps.location || 'Non spécifiée'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tarif horaire</span>
                    <p className="text-sm text-gray-600">{selectedEvent?.extendedProps.rate || 0}€</p>
                  </div>
                </div>
              </div>

              {selectedEvent?.extendedProps.description && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <p className="text-sm text-gray-600">{selectedEvent.extendedProps.description}</p>
                </div>
              )}

              {selectedEvent?.extendedProps.requirements && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Exigences</span>
                  <p className="text-sm text-gray-600">{selectedEvent.extendedProps.requirements}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm font-medium text-gray-700">Statut</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedEvent?.extendedProps.status === 'booked' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedEvent?.extendedProps.status === 'booked' ? 'Réservé' : 'Disponible'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteSlot(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer ce créneau
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteSlot(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer toutes les occurrences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une vacation</DialogTitle>
            <DialogDescription>
              Configurez les détails de votre vacation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateSlot();
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Titre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={selectedSlot.title}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, title: e.target.value })}
                    placeholder="Ex: Consultation générale"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speciality" className="text-sm font-medium">
                    Spécialité <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSlot.speciality}
                    onValueChange={(value) => setSelectedSlot({ ...selectedSlot, speciality: value as Speciality })}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez une spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_medicine">Médecine générale</SelectItem>
                      <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                      <SelectItem value="dermatology">Dermatologie</SelectItem>
                      <SelectItem value="ophthalmology">Ophtalmologie</SelectItem>
                      <SelectItem value="gynecology">Gynécologie</SelectItem>
                      <SelectItem value="cardiology">Cardiologie</SelectItem>
                      <SelectItem value="neurology">Neurologie</SelectItem>
                      <SelectItem value="psychiatry">Psychiatrie</SelectItem>
                      <SelectItem value="orthopedics">Orthopédie</SelectItem>
                      <SelectItem value="dentistry">Dentisterie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Zone géographique <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={selectedSlot.location}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, location: e.target.value })}
                    placeholder="Ex: Paris 11ème"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-sm font-medium">
                    Tarif horaire (€) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedSlot.rate}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, rate: parseFloat(e.target.value) })}
                    placeholder="Ex: 50"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="act_type" className="text-sm font-medium">
                    Type d'acte
                  </Label>
                  <Select
                    value={selectedSlot.act_type}
                    onValueChange={(value) => setSelectedSlot({ ...selectedSlot, act_type: value as 'consultation' | 'urgence' | 'visite' | 'teleconsultation' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez un type d'acte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="urgence">Urgence</SelectItem>
                      <SelectItem value="visite">Visite</SelectItem>
                      <SelectItem value="teleconsultation">Téléconsultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-sm font-medium">
                    Prérequis
                  </Label>
                  <Input
                    id="requirements"
                    value={selectedSlot.requirements}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, requirements: e.target.value })}
                    placeholder="Ex: Carte vitale, ordonnance"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Récurrence</Label>
                  <Switch
                    checked={recurrenceSettings.type !== 'none'}
                    onCheckedChange={(checked) => {
                      setRecurrenceSettings({
                        type: checked ? 'daily' : 'none',
                        endType: 'never'
                      });
                    }}
                  />
                </div>

                {recurrenceSettings.type !== 'none' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Fréquence</Label>
                        <Select
                          value={recurrenceSettings.type}
                          onValueChange={(value) => setRecurrenceSettings({ ...recurrenceSettings, type: value as RecurrenceType })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une fréquence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidien</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Fin de récurrence</Label>
                        <Select
                          value={recurrenceSettings.endType}
                          onValueChange={(value) => setRecurrenceSettings({ ...recurrenceSettings, endType: value as RecurrenceEndType })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une fin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Jamais</SelectItem>
                            <SelectItem value="count">Après X occurrences</SelectItem>
                            <SelectItem value="date">À une date spécifique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {recurrenceSettings.endType === 'count' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nombre d'occurrences</Label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrenceSettings.count}
                          onChange={(e) => setRecurrenceSettings({ ...recurrenceSettings, count: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    )}

                    {recurrenceSettings.endType === 'date' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date de fin</Label>
                        <Input
                          type="date"
                          value={recurrenceSettings.endDate}
                          onChange={(e) => setRecurrenceSettings({ ...recurrenceSettings, endDate: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-medical-blue to-blue-600 hover:from-blue-600 hover:to-medical-blue text-white">
                  Créer la vacation
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 