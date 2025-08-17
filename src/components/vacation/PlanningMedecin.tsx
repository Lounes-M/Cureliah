import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import { VacationPost, TimeSlot, Speciality } from "@/types/database";
import { format, parseISO, addDays, addWeeks, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import "@/styles/calendar.css";
import Logger from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, User, Clock, Repeat, Trash2, Plus, MapPin, Euro, Stethoscope, Sparkles, Heart, Activity, Zap, X, Check } from "lucide-react";
import { SPECIALITIES } from "@/utils/specialities";
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
    status: "available" | "booked";
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

type RecurrenceType = "none" | "daily" | "weekly" | "monthly";
type RecurrenceEndType = "never" | "count" | "date";

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
  status: "available" | "booked";
  act_type: "consultation" | "urgence" | "visite" | "teleconsultation";
}

interface TimeSlotData {
  id: string;
  type: "morning" | "afternoon" | "custom";
  start_time: string | null;
  end_time: string | null;
  vacation_id: string;
  vacation_posts: VacationPostData;
}

interface VacationFormData {
  title: string;
  description: string;
  speciality: Speciality;
  start_time: string;
  end_time: string;
  location: string;
  act_type: "consultation" | "urgence" | "visite" | "teleconsultation";
  rate: number;
  requirements: string;
}

export const PlanningMedecin = ({
  doctorId,
  onSlotCreated,
  onSlotUpdated,
}: PlanningMedecinProps) => {
  const logger = Logger.getInstance();
  const [events, setEvents] = useState<TimeSlotEvent[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VacationFormData>({
    title: "",
    description: "",
    speciality: "general_medicine",
    start_time: "",
    end_time: "",
    location: "",
    act_type: "consultation",
    rate: 0,
    requirements: "",
  });
  const [recurrenceSettings, setRecurrenceSettings] =
    useState<RecurrenceSettings>({
      type: "none",
      endType: "never",
    });
  const [selectedDate, setSelectedDate] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimeSlotEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeSlots();
    setAnimateStats(true);
  }, [doctorId]);

  const fetchTimeSlots = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with logger.info("Fetching time slots for doctor:", doctorId);

      const { data: vacationStructure, error: structureError } = await supabase
        .from("vacation_posts")
        .select("*")
        .limit(1);

      if (structureError) {
        // TODO: Replace with logger.error("Error fetching vacation structure:", structureError);
      } else {
        // TODO: Replace with logger.info("Vacation posts structure:", vacationStructure);
      }

      const { data: vacations, error: vacationsError } = await supabase
        .from("vacation_posts")
        .select("id")
        .eq("doctor_id", doctorId);

      if (vacationsError) {
        // TODO: Replace with logger.error("Error fetching vacations:", vacationsError);
        throw vacationsError;
      }

      // TODO: Replace with logger.info("Found vacations:", vacations);

      if (!vacations || vacations.length === 0) {
        // TODO: Replace with logger.info("No vacations found");
        setEvents([]);
        return;
      }

      const BATCH_SIZE = 50;
      const allSlots = [];

      for (let i = 0; i < vacations.length; i += BATCH_SIZE) {
        const batch = vacations.slice(i, i + BATCH_SIZE);
        logger.debug(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
          vacations.length / BATCH_SIZE
        )}`, 
        { 
          batchNumber: i / BATCH_SIZE + 1, 
          totalBatches: Math.ceil(vacations.length / BATCH_SIZE),
          batchSize: batch.length 
        }, 
        'PlanningMedecin', 
        'vacation_batch_processing'
        );

        const { data: slots, error: slotsError } = await supabase
          .from("time_slots")
          .select(
            `
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
          `
          )
          .in(
            "vacation_id",
            batch.map((v) => v.id)
          );

        if (slotsError) {
          // TODO: Replace with logger.error("Error fetching slots batch:", slotsError);
          throw slotsError;
        }

        if (slots) {
          allSlots.push(...slots);
        }
      }

      // TODO: Replace with logger.info("Found total slots:", allSlots.length);

      const calendarEvents =
        allSlots
          .map((slot) => {
            const vacationPost = Array.isArray(slot.vacation_posts)
              ? (slot.vacation_posts[0] as VacationPostData)
              : (slot.vacation_posts as VacationPostData);

            if (!vacationPost) {
              // TODO: Replace with logger.warn("Slot without vacation_posts:", slot);
              return null;
            }

            let startTime, endTime;

            if (slot.type === "morning") {
              startTime = "08:00:00";
              endTime = "12:00:00";
            } else if (slot.type === "afternoon") {
              startTime = "14:00:00";
              endTime = "18:00:00";
            } else if (slot.type === "custom") {
              if (!slot.start_time || !slot.end_time) {
                // TODO: Replace with logger.warn("Custom time slot has invalid dates:", slot);
                return null;
              }
              startTime = slot.start_time;
              endTime = slot.end_time;
            } else {
              // TODO: Replace with logger.warn("Unknown time slot type:", slot);
              return null;
            }

            try {
              const startDate = new Date(vacationPost.start_date);
              const endDate = new Date(vacationPost.end_date);

              const [startHours, startMinutes] = startTime.split(":");
              const [endHours, endMinutes] = endTime.split(":");

              startDate.setHours(parseInt(startHours), parseInt(startMinutes));
              endDate.setHours(parseInt(endHours), parseInt(endMinutes));

              return {
                id: slot.id,
                title: vacationPost.title || "Vacation",
                start: startDate,
                end: endDate,
                extendedProps: {
                  status: vacationPost.status || "available",
                  location: vacationPost.location || "",
                  actType: vacationPost.act_type || "consultation",
                  rate: vacationPost.hourly_rate || 0,
                  speciality: vacationPost.speciality || "general_medicine",
                  description: vacationPost.description || "",
                  requirements: vacationPost.requirements || "",
                  type: slot.type,
                  isRecurring: false,
                  vacationId: vacationPost.id,
                },
                backgroundColor:
                  vacationPost.status === "booked" ? "#10b981" : "#8b5cf6",
                borderColor:
                  vacationPost.status === "booked" ? "#059669" : "#7c3aed",
                textColor: "#ffffff",
              };
            } catch (error) {
              // TODO: Replace with logger.error("Error processing slot:", error, slot);
              return null;
            }
          })
          .filter(Boolean) || [];

      // TODO: Replace with logger.info("Processed calendar events:", calendarEvents);
      setEvents(calendarEvents);
    } catch (error) {
      // TODO: Replace with logger.error("Error fetching time slots:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger les créneaux",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setSelectedSlot({
      title: "",
      description: "",
      speciality: "general_medicine",
      start_time: format(selectInfo.start, "yyyy-MM-dd'T'HH:mm:ss"),
      end_time: format(selectInfo.end, "yyyy-MM-dd'T'HH:mm:ss"),
      location: "",
      act_type: "consultation",
      rate: 0,
      requirements: "",
    });
    setShowCreateDialog(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    // TODO: Replace with logger.info("Event clicked:", event);
    // TODO: Replace with logger.info("Event extended props:", event.extendedProps);
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps,
    });
    setShowDeleteDialog(true);
  };

  const handleCreateSlot = async () => {
    try {
      if (!selectedDate) return;

      setIsLoading(true);
      setShowCreateDialog(false);

      const dates: { start: Date; end: Date }[] = [];

      if (recurrenceSettings.type === "none") {
        dates.push(selectedDate);
      } else {
        let currentDate = new Date(selectedDate.start);
        const endDate =
          recurrenceSettings.endType === "date"
            ? new Date(recurrenceSettings.endDate!)
            : recurrenceSettings.endType === "count"
            ? addDays(
                currentDate,
                recurrenceSettings.count! *
                  (recurrenceSettings.type === "daily"
                    ? 1
                    : recurrenceSettings.type === "weekly"
                    ? 7
                    : 30)
              )
            : addMonths(currentDate, 12);

        while (currentDate <= endDate) {
          dates.push({
            start: new Date(currentDate),
            end: new Date(
              currentDate.getTime() +
                (selectedDate.end.getTime() - selectedDate.start.getTime())
            ),
          });

          switch (recurrenceSettings.type) {
            case "daily":
              currentDate = addDays(currentDate, 1);
              break;
            case "weekly":
              currentDate = addWeeks(currentDate, 1);
              break;
            case "monthly":
              currentDate = addMonths(currentDate, 1);
              break;
          }
        }
      }

      let createdCount = 0;
      const createdVacations = [];

      for (const date of dates) {
        const { data: vacation, error: vacationError } = await supabase
          .from("vacation_posts")
          .insert([
            {
              doctor_id: doctorId,
              title: selectedSlot.title || "Disponibilité",
              description:
                selectedSlot.description || "Disponibilité récurrente",
              speciality: selectedSlot.speciality,
              start_date: format(date.start, "yyyy-MM-dd'T'HH:mm:ss"),
              end_date: format(date.end, "yyyy-MM-dd'T'HH:mm:ss"),
              hourly_rate: selectedSlot.rate || 0,
              location: selectedSlot.location || "",
              requirements: selectedSlot.requirements || "",
              status: "available",
              act_type: selectedSlot.act_type,
            },
          ])
          .select()
          .single();

        if (vacationError) throw vacationError;
        if (vacation) createdVacations.push(vacation);

        const startTime = date.start;
        const endTime = date.end;
        let slotType: "morning" | "afternoon" | "custom" = "custom";

        if (startTime.getHours() === 8 && endTime.getHours() === 12) {
          slotType = "morning";
        } else if (startTime.getHours() === 14 && endTime.getHours() === 18) {
          slotType = "afternoon";
        }

        let startTimeStr = null;
        let endTimeStr = null;

        if (slotType === "custom") {
          startTimeStr = startTime.toTimeString().slice(0, 8);
          endTimeStr = endTime.toTimeString().slice(0, 8);
        }

        const { error: slotError } = await supabase.from("time_slots").insert([
          {
            vacation_id: vacation.id,
            type: slotType,
            start_time: startTimeStr,
            end_time: endTimeStr,
          },
        ]);

        if (slotError) throw slotError;
        createdCount++;
      }

      setSelectedSlot({
        title: "",
        description: "",
        speciality: "general_medicine",
        start_time: "",
        end_time: "",
        location: "",
        act_type: "consultation",
        rate: 0,
        requirements: "",
      });
      setRecurrenceSettings({
        type: "none",
        endType: "never",
      });
      setSelectedDate(null);

      if (onSlotCreated) {
        onSlotCreated();
      }

      await fetchTimeSlots();

      toast({
        title: "✨ Succès !",
        description: `${createdCount} créneau${createdCount > 1 ? 'x' : ''} créé${createdCount > 1 ? 's' : ''} avec succès`,
      });

      const planningElement = document.querySelector(".fc-view-harness");
      if (planningElement) {
        planningElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) {
      // TODO: Replace with logger.error("Error creating time slots:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de créer les disponibilités",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (deleteAll: boolean) => {
    try {
      if (!selectedEvent) return;

      setIsLoading(true);

      if (deleteAll) {
        const { data: currentVacation, error: vacationError } = await supabase
          .from("vacation_posts")
          .select("*")
          .eq("id", selectedEvent.extendedProps.vacationId)
          .single();

        if (vacationError) throw vacationError;

        if (currentVacation) {
          const { data: similarSlots, error: slotsError } = await supabase
            .from("time_slots")
            .select(
              `
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
            `
            )
            .eq("type", selectedEvent.extendedProps.type)
            .eq(
              "start_time",
              selectedEvent.extendedProps.type === "custom"
                ? format(selectedEvent.start, "HH:mm:ss")
                : null
            )
            .eq(
              "end_time",
              selectedEvent.extendedProps.type === "custom"
                ? format(selectedEvent.end, "HH:mm:ss")
                : null
            );

          if (slotsError) throw slotsError;

          if (similarSlots) {
            const vacationIds = similarSlots
              .filter((slot) => {
                const vacation = Array.isArray(slot.vacation_posts)
                  ? slot.vacation_posts[0]
                  : slot.vacation_posts;
                return (
                  vacation &&
                  vacation.title === currentVacation.title &&
                  vacation.speciality === currentVacation.speciality &&
                  vacation.act_type === currentVacation.act_type
                );
              })
              .map((slot) => {
                const vacation = Array.isArray(slot.vacation_posts)
                  ? slot.vacation_posts[0]
                  : slot.vacation_posts;
                return vacation.id;
              });

            if (vacationIds.length > 0) {
              const { error: deleteError } = await supabase
                .from("vacation_posts")
                .delete()
                .in("id", vacationIds);

              if (deleteError) throw deleteError;
            }
          }
        }
      } else {
        const { error: slotError } = await supabase
          .from("time_slots")
          .delete()
          .eq("id", selectedEvent.id);

        if (slotError) throw slotError;

        const { data: remainingSlots, error: countError } = await supabase
          .from("time_slots")
          .select("id")
          .eq("vacation_id", selectedEvent.extendedProps.vacationId);

        if (countError) throw countError;

        if (!remainingSlots || remainingSlots.length === 0) {
          const { error: vacationError } = await supabase
            .from("vacation_posts")
            .delete()
            .eq("id", selectedEvent.extendedProps.vacationId);

          if (vacationError) throw vacationError;
        }
      }

      toast({
        title: "✅ Supprimé !",
        description: deleteAll
          ? "Toutes les occurrences similaires ont été supprimées"
          : "Le créneau a été supprimé",
      });

      setShowDeleteDialog(false);
      setSelectedEvent(null);

      if (onSlotUpdated) {
        onSlotUpdated();
      }

      fetchTimeSlots();
    } catch (error) {
      // TODO: Replace with logger.error("Error deleting time slot:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer le créneau",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = {
    available: events.filter(e => e.extendedProps.status === "available").length,
    booked: events.filter(e => e.extendedProps.status === "booked").length,
    total: events.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header avec statistiques animées */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Stethoscope className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mon Planning
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos créneaux de consultation</p>
            </div>
          </div>
          
          {/* Statistiques animées */}
          <div className="flex gap-4">
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-700 ${animateStats ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-emerald-600">{statsData.available}</p>
                </div>
              </div>
            </div>
            
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-700 delay-100 ${animateStats ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Réservés</p>
                  <p className="text-2xl font-bold text-medical-blue">{statsData.booked}</p>
                </div>
              </div>
            </div>
            
            <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-700 delay-200 ${animateStats ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-purple-600">{statsData.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier principal avec styles personnalisés */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <style>{`
          .fc {
            background: transparent;
          }
          
          .fc-header-toolbar {
            padding: 1.5rem 2rem 1rem 2rem !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border-radius: 1.5rem 1.5rem 0 0 !important;
            margin-bottom: 0 !important;
          }
          
          .fc-toolbar-chunk {
            display: flex;
            align-items: center;
          }
          
          .fc-button {
            background: rgba(255, 255, 255, 0.2) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            color: white !important;
            border-radius: 12px !important;
            padding: 8px 16px !important;
            font-weight: 600 !important;
            transition: all 0.3s ease !important;
            backdrop-filter: blur(10px) !important;
          }
          
          .fc-button:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          .fc-button:focus {
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3) !important;
          }
          
          .fc-button-active {
            background: rgba(255, 255, 255, 0.4) !important;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
          
          .fc-toolbar-title {
            color: white !important;
            font-size: 1.75rem !important;
            font-weight: 700 !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
          
          .fc-view-harness {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
            border-radius: 0 0 1.5rem 1.5rem !important;
          }
          
          .fc-timegrid-slot {
            background: transparent !important;
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          
          .fc-timegrid-slot:hover {
            background: rgba(139, 92, 246, 0.05) !important;
          }
          
          .fc-timegrid-axis {
            background: rgba(255, 255, 255, 0.8) !important;
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          
          .fc-timegrid-slot-label {
            color: #64748b !important;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
          }
          
          .fc-col-header {
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          
          .fc-col-header-cell {
            padding: 1rem 0.5rem !important;
          }
          
          .fc-col-header-cell-cushion {
            color: #475569 !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
            text-transform: capitalize !important;
          }
          
          .fc-daygrid-day-top {
            color: #64748b !important;
            font-weight: 600 !important;
          }
          
          .fc-timegrid-col {
            border-color: rgba(148, 163, 184, 0.2) !important;
          }
          
          .fc-timegrid-now-indicator-line {
            border-color: #ef4444 !important;
            border-width: 2px !important;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.3) !important;
          }
          
          .fc-timegrid-now-indicator-arrow {
            border-top-color: #ef4444 !important;
            border-bottom-color: #ef4444 !important;
          }
          
          .fc-scrollgrid {
            border-color: rgba(148, 163, 184, 0.2) !important;
            border-radius: 0 0 1.5rem 1.5rem !important;
            overflow: hidden !important;
          }
          
          .fc-scrollgrid-section-header {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
          }
          
          .fc-v-event {
            border-radius: 12px !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.3s ease !important;
          }
          
          .fc-v-event:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
          }
          
          .fc-highlight {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%) !important;
            border-radius: 8px !important;
            border: 2px dashed rgba(139, 92, 246, 0.3) !important;
          }
          
          .fc-select-mirror {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%) !important;
            border-radius: 12px !important;
            border: 2px solid rgba(139, 92, 246, 0.5) !important;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2) !important;
          }
          
          .fc-today {
            background: rgba(255, 248, 113, 0.1) !important;
          }
          
          .fc-day-past {
            background: rgba(148, 163, 184, 0.05) !important;
          }
          
          .fc-day-future {
            background: rgba(59, 130, 246, 0.02) !important;
          }
          
          .fc-more-link {
            background: rgba(139, 92, 246, 0.1) !important;
            color: #7c3aed !important;
            border-radius: 8px !important;
            padding: 2px 8px !important;
            font-weight: 600 !important;
          }
          
          .fc-popover {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(148, 163, 184, 0.2) !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          }
          
          .fc-scroller {
            overflow-x: hidden !important;
          }
          
          .fc-timegrid-divider {
            background: rgba(148, 163, 184, 0.1) !important;
          }
          
          /* Animation pour le chargement */
          .fc-view-harness.loading {
            position: relative;
          }
          
          .fc-view-harness.loading::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            z-index: 1000;
            border-radius: 0 0 1.5rem 1.5rem;
          }
        `}</style>
        
        <div className="h-[800px] p-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
              <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 font-semibold text-lg">Chargement du planning...</span>
              </div>
            </div>
          )}
          
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay",
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
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            expandRows={true}
            stickyHeaderDates={true}
            stickyFooterScrollbar={true}
            eventContent={(eventInfo) => (
              <div
                className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${
                  eventInfo.event.extendedProps.status === "booked"
                    ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white shadow-emerald-200"
                    : "bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-500 text-white shadow-purple-200"
                } shadow-lg border border-white/20`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10 flex items-center gap-2">
                  {eventInfo.event.extendedProps.status === "booked" ? (
                    <User className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-sm truncate">
                      {eventInfo.event.title}
                    </span>
                    <span className="text-xs opacity-90 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(eventInfo.event.start, "HH:mm")} - {format(eventInfo.event.end, "HH:mm")}
                    </span>
                    <span className="text-xs opacity-75 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {eventInfo.event.extendedProps.location}
                    </span>
                  </div>
                </div>
                
                <div className="absolute top-1 right-1">
                  <div className={`w-2 h-2 rounded-full ${
                    eventInfo.event.extendedProps.status === "booked" 
                      ? "bg-emerald-300" 
                      : "bg-purple-300"
                  } animate-pulse`}></div>
                </div>
              </div>
            )}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              omitZeroMinute: true,
            }}
            dayHeaderFormat={{
              weekday: "long",
              day: "numeric",
              month: "long",
            }}
            nowIndicator={true}
            selectConstraint="businessHours"
            selectOverlap={false}
            eventOverlap={false}
            eventConstraint="businessHours"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: "00:00",
              endTime: "24:00",
            }}
            scrollTime="08:00:00"
            scrollTimeReset={false}
            handleWindowResize={true}
            windowResizeDelay={100}
            contentHeight="auto"
            aspectRatio={1.8}
            buttonText={{
              today: "Aujourd'hui",
              week: "Semaine",
              day: "Jour",
            }}
          />
        </div>
      </div>

      {/* Modal de détails avec animations */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
              Détails de la vacation
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Informations complètes sur cette vacation
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 max-h-[60vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-6 border border-blue-100">
              <div className="border-b border-blue-200 pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                    selectedEvent?.extendedProps.status === "booked" 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "bg-gradient-to-br from-violet-500 to-purple-500"
                  } text-white shadow-lg`}>
                    {selectedEvent?.extendedProps.status === "booked" ? "✅" : "📅"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedEvent?.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {selectedEvent &&
                            format(selectedEvent.start, "EEEE d MMMM yyyy", {
                              locale: fr,
                            })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {selectedEvent &&
                            `${format(selectedEvent.start, "HH:mm")} - ${format(
                              selectedEvent.end,
                              "HH:mm"
                            )}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <Stethoscope className="w-5 h-5 text-medical-blue-light" />
                      <span className="font-semibold text-gray-700">Spécialité</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {SPECIALITIES[selectedEvent?.extendedProps.speciality]
                        ?.label || selectedEvent?.extendedProps.speciality}
                    </p>
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-gray-700">Type d'acte</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {selectedEvent?.extendedProps.actType === "consultation" && "🩺 Consultation"}
                      {selectedEvent?.extendedProps.actType === "urgence" && "🚨 Urgence"}
                      {selectedEvent?.extendedProps.actType === "visite" && "🏠 Visite à domicile"}
                      {selectedEvent?.extendedProps.actType === "teleconsultation" && "💻 Téléconsultation"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-gray-700">Localisation</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      📍 {selectedEvent?.extendedProps.location || "Non spécifiée"}
                    </p>
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <Euro className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-gray-700">Tarif horaire</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedEvent?.extendedProps.rate || 0}€
                    </p>
                  </div>
                </div>
              </div>

              {selectedEvent?.extendedProps.description && (
                <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="font-semibold text-gray-700">Description</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedEvent.extendedProps.description}
                  </p>
                </div>
              )}

              {selectedEvent?.extendedProps.requirements && (
                <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-rose-500" />
                    <span className="font-semibold text-gray-700">Exigences</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedEvent.extendedProps.requirements}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center pt-4">
                <div className={`px-6 py-3 rounded-2xl font-semibold text-lg ${
                  selectedEvent?.extendedProps.status === "booked"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200"
                    : "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-purple-200"
                } shadow-lg`}>
                  {selectedEvent?.extendedProps.status === "booked"
                    ? "✅ Créneau Réservé"
                    : "📅 Créneau Disponible"}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto border-gray-200 hover:bg-gray-50 transition-all duration-300"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteSlot(false)}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-red-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer ce créneau
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteSlot(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-orange-200"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Supprimer toutes les occurrences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création avec design moderne */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
              ✨ Créer une nouvelle vacation
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Configurez tous les détails de votre vacation médicale
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 max-h-[70vh] overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateSlot();
              }}
              className="space-y-8"
            >
              {/* Informations principales */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-medical-blue-light" />
                  Informations principales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                      Titre de la vacation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={selectedSlot.title}
                      onChange={(e) =>
                        setSelectedSlot({
                          ...selectedSlot,
                          title: e.target.value,
                        })
                      }
                      placeholder="Ex: Consultation générale"
                      required
                      className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="speciality" className="text-sm font-semibold text-gray-700">
                      Spécialité médicale <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedSlot.speciality}
                      onValueChange={(value) =>
                        setSelectedSlot({
                          ...selectedSlot,
                          speciality: value as Speciality,
                        })
                      }
                      required
                    >
                      <SelectTrigger className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300">
                        <SelectValue placeholder="Sélectionnez une spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_medicine">🩺 Médecine générale</SelectItem>
                        <SelectItem value="pediatrics">👶 Pédiatrie</SelectItem>
                        <SelectItem value="dermatology">🧴 Dermatologie</SelectItem>
                        <SelectItem value="ophthalmology">👁️ Ophtalmologie</SelectItem>
                        <SelectItem value="gynecology">🌸 Gynécologie</SelectItem>
                        <SelectItem value="cardiology">❤️ Cardiologie</SelectItem>
                        <SelectItem value="neurology">🧠 Neurologie</SelectItem>
                        <SelectItem value="psychiatry">🧘 Psychiatrie</SelectItem>
                        <SelectItem value="orthopedics">🦴 Orthopédie</SelectItem>
                        <SelectItem value="dentistry">🦷 Dentisterie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                      Zone géographique <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="location"
                      value={selectedSlot.location}
                      onChange={(e) =>
                        setSelectedSlot({
                          ...selectedSlot,
                          location: e.target.value,
                        })
                      }
                      placeholder="Ex: Paris 11ème"
                      required
                      className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-semibold text-gray-700">
                      Tarif horaire (€) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="rate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedSlot.rate}
                        onChange={(e) =>
                          setSelectedSlot({
                            ...selectedSlot,
                            rate: parseFloat(e.target.value),
                          })
                        }
                        placeholder="50"
                        required
                        className="pl-10 bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="act_type" className="text-sm font-semibold text-gray-700">
                      Type d'acte médical
                    </Label>
                    <Select
                      value={selectedSlot.act_type}
                      onValueChange={(value) =>
                        setSelectedSlot({
                          ...selectedSlot,
                          act_type: value as
                            | "consultation"
                            | "urgence"
                            | "visite"
                            | "teleconsultation",
                        })
                      }
                    >
                      <SelectTrigger className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300">
                        <SelectValue placeholder="Sélectionnez un type d'acte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">🩺 Consultation</SelectItem>
                        <SelectItem value="urgence">🚨 Urgence</SelectItem>
                        <SelectItem value="visite">🏠 Visite à domicile</SelectItem>
                        <SelectItem value="teleconsultation">💻 Téléconsultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements" className="text-sm font-semibold text-gray-700">
                      Prérequis et exigences
                    </Label>
                    <Input
                      id="requirements"
                      value={selectedSlot.requirements}
                      onChange={(e) =>
                        setSelectedSlot({
                          ...selectedSlot,
                          requirements: e.target.value,
                        })
                      }
                      placeholder="Ex: Carte vitale, ordonnance"
                      className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Description détaillée
                  </Label>
                  <Textarea
                    id="description"
                    value={selectedSlot.description}
                    onChange={(e) =>
                      setSelectedSlot({
                        ...selectedSlot,
                        description: e.target.value,
                      })
                    }
                    placeholder="Décrivez votre vacation en détail..."
                    rows={3}
                    className="bg-white/80 border-white/50 focus:border-blue-400 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Paramètres de récurrence */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-800">Récurrence</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Activer la récurrence</span>
                    <Switch
                      checked={recurrenceSettings.type !== "none"}
                      onCheckedChange={(checked) => {
                        setRecurrenceSettings({
                          type: checked ? "weekly" : "none",
                          endType: "never",
                        });
                      }}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>

                {recurrenceSettings.type !== "none" && (
                  <div className="space-y-6 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Fréquence de répétition</Label>
                        <Select
                          value={recurrenceSettings.type}
                          onValueChange={(value) =>
                            setRecurrenceSettings({
                              ...recurrenceSettings,
                              type: value as RecurrenceType,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/80 border-white/50 focus:border-purple-400 transition-all duration-300">
                            <SelectValue placeholder="Sélectionnez une fréquence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">📅 Quotidien</SelectItem>
                            <SelectItem value="weekly">📆 Hebdomadaire</SelectItem>
                            <SelectItem value="monthly">🗓️ Mensuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Fin de la récurrence</Label>
                        <Select
                          value={recurrenceSettings.endType}
                          onValueChange={(value) =>
                            setRecurrenceSettings({
                              ...recurrenceSettings,
                              endType: value as RecurrenceEndType,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/80 border-white/50 focus:border-purple-400 transition-all duration-300">
                            <SelectValue placeholder="Quand arrêter ?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">♾️ Jamais</SelectItem>
                            <SelectItem value="count">🔢 Après X occurrences</SelectItem>
                            <SelectItem value="date">📅 À une date spécifique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {recurrenceSettings.endType === "count" && (
                      <div className="space-y-2 animate-in slide-in-from-left duration-300">
                        <Label className="text-sm font-semibold text-gray-700">Nombre d'occurrences</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={recurrenceSettings.count || ''}
                          onChange={(e) =>
                            setRecurrenceSettings({
                              ...recurrenceSettings,
                              count: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="Ex: 10"
                          className="bg-white/80 border-white/50 focus:border-purple-400 transition-all duration-300"
                        />
                      </div>
                    )}

                    {recurrenceSettings.endType === "date" && (
                      <div className="space-y-2 animate-in slide-in-from-right duration-300">
                        <Label className="text-sm font-semibold text-gray-700">Date de fin</Label>
                        <Input
                          type="date"
                          value={recurrenceSettings.endDate || ''}
                          onChange={(e) =>
                            setRecurrenceSettings({
                              ...recurrenceSettings,
                              endDate: e.target.value,
                            })
                          }
                          className="bg-white/80 border-white/50 focus:border-purple-400 transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-purple-200 transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer la vacation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};