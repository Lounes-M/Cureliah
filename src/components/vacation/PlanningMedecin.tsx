// Styles FullCalendar v6 : à importer via CDN dans index.html
import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import { Speciality } from "@/types/database";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import "@/styles/calendar.css";
import "@/styles/planningMedecin.css";
import { logger } from '@/services/logger';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
import {
  Calendar,
  User,
  Clock,
  Repeat,
  Trash2,
  Plus,
  MapPin,
  Stethoscope,
  Sparkles,
  Heart,
  Activity,
  Zap,
  X,
} from "lucide-react";
import { SPECIALITIES } from "@/utils/specialities";
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
    recurrenceGroupId: string | null;
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
  recurrence_group_id: string | null;
}

interface VacationFormData {
  title: string;
  description: string;
  speciality: Speciality;
  location: string;
  act_type: "consultation" | "urgence" | "visite" | "teleconsultation";
  rate: number;
  requirements: string;
}

type VacationPostsRelation = VacationPostData | VacationPostData[] | null;

interface TimeSlotData {
  id: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  vacation_id: string;
  vacation_posts: VacationPostsRelation;
}

export const PlanningMedecin = ({
  doctorId,
  onSlotCreated,
  onSlotUpdated,
}: PlanningMedecinProps) => {
  const [events, setEvents] = useState<TimeSlotEvent[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VacationFormData>({
    title: "",
    description: "",
    speciality: "general_medicine",
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
  const calendarRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimeSlotEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const { toast } = useToast();

  const fetchTimeSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      logger.debug("Fetching time slots for doctor", { doctorId, component: 'PlanningMedecin', action: 'fetch_time_slots' });

      const { data: slots, error: slotsError } = await supabase
        .from<TimeSlotData>("time_slots")
        .select(
          `
          id,
          type,
          start_time,
          end_time,
          vacation_id,
          vacation_posts!inner (
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
            act_type,
            recurrence_group_id
          )
        `
        )
        .eq("vacation_posts.doctor_id", doctorId);

      if (slotsError) {
        logger.error("Error fetching time slots", slotsError, { doctorId, component: 'PlanningMedecin', action: 'slots_error' });
        throw slotsError;
      }

      if (!slots || slots.length === 0) {
        logger.info("No time slots found", { doctorId, component: 'PlanningMedecin', action: 'no_slots' });
        setEvents([]);
        return;
      }

      logger.info("Found total slots", { slotsCount: slots.length, component: 'PlanningMedecin', action: 'total_slots_found' });

      const calendarEvents =
        slots
          .map((slot) => {
            const vacationPost = Array.isArray(slot.vacation_posts)
              ? (slot.vacation_posts[0] as VacationPostData)
              : (slot.vacation_posts as VacationPostData);

            if (!vacationPost) {
              logger.warn("Slot without vacation_posts", { ...slot, component: 'PlanningMedecin', action: 'missing_vacation' });
              return null;
            }

            try {
              const startDate = new Date(vacationPost.start_date);
              const endDate = new Date(vacationPost.end_date);

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
                  isRecurring: Boolean(vacationPost.recurrence_group_id),
                  vacationId: vacationPost.id,
                  recurrenceGroupId: vacationPost.recurrence_group_id,
                },
              };
            } catch (error) {
              logger.error("Error processing slot", error as Error, { ...slot, component: 'PlanningMedecin', action: 'process_slot' });
              return null;
            }
          })
          .filter(Boolean) || [];

      logger.info("Processed calendar events", { events: calendarEvents, component: 'PlanningMedecin', action: 'calendar_events_processed' });
      setEvents(calendarEvents);
    } catch (error) {
      logger.error("Error fetching time slots", error as Error, { component: 'PlanningMedecin', action: 'fetch_time_slots' });
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger les créneaux",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, logger, toast]);

  useEffect(() => {
    fetchTimeSlots();
    setAnimateStats(true);
  }, [fetchTimeSlots]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setSelectedSlot({
      title: "",
      description: "",
      speciality: "general_medicine",
      location: "",
      act_type: "consultation",
      rate: 0,
      requirements: "",
    });
    setShowCreateDialog(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    logger.info("Event clicked", { event, component: 'PlanningMedecin', action: 'event_clicked' });
    logger.info("Event extended props", { props: event.extendedProps, component: 'PlanningMedecin', action: 'event_props' });
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start!,
      end: event.end!,
      extendedProps: event.extendedProps as TimeSlotEvent["extendedProps"],
    });
    setShowDeleteDialog(true);
  };

  const handleCreateSlot = async () => {
    try {
      if (!selectedDate) return;

      setIsLoading(true);
      setShowCreateDialog(false);

      const duration = selectedDate.end.getTime() - selectedDate.start.getTime();
      const dates: { start: Date; end: Date }[] = [];

      if (recurrenceSettings.type === "none") {
        dates.push(selectedDate);
      } else if (recurrenceSettings.endType === "count") {
        const n = Math.max(1, recurrenceSettings.count ?? 1);
        let cur = new Date(selectedDate.start);
        for (let i = 0; i < n; i++) {
          dates.push({
            start: new Date(cur),
            end: new Date(cur.getTime() + duration),
          });
          if (recurrenceSettings.type === "daily") cur = addDays(cur, 1);
          if (recurrenceSettings.type === "weekly") cur = addWeeks(cur, 1);
          if (recurrenceSettings.type === "monthly") cur = addMonths(cur, 1);
        }
      } else {
        const hardStop =
          recurrenceSettings.endType === "date"
            ? new Date(recurrenceSettings.endDate!)
            : addMonths(selectedDate.start, 12);
        let cur = new Date(selectedDate.start);
        while (cur <= hardStop) {
          dates.push({
            start: new Date(cur),
            end: new Date(cur.getTime() + duration),
          });
          if (recurrenceSettings.type === "daily") cur = addDays(cur, 1);
          if (recurrenceSettings.type === "weekly") cur = addWeeks(cur, 1);
          if (recurrenceSettings.type === "monthly") cur = addMonths(cur, 1);
        }
      }

      const groupId = crypto.randomUUID();

      const vacationsPayload = dates.map((date) => ({
        doctor_id: doctorId,
        title: selectedSlot.title || "Disponibilité",
        description: selectedSlot.description || "Disponibilité récurrente",
        speciality: selectedSlot.speciality,
        start_date: new Date(date.start).toISOString(),
        end_date: new Date(date.end).toISOString(),
        hourly_rate: selectedSlot.rate || 0,
        location: selectedSlot.location || "",
        requirements: selectedSlot.requirements || "",
        status: "available",
        act_type: selectedSlot.act_type,
        recurrence_group_id: groupId,
      }));

      const { data: insertedVacations, error: vacationError } = await supabase
        .from("vacation_posts")
        .insert(vacationsPayload)
        .select();

      if (vacationError) throw vacationError;

      const timeSlotPayload = (insertedVacations || []).map((vacation, idx) => {
        const startTime = dates[idx].start;
        const endTime = dates[idx].end;
        let slotType: "morning" | "afternoon" | "custom" = "custom";

        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        const within = (target: number, value: number) =>
          Math.abs(value - target) <= 60;
        if (within(8 * 60, startMinutes) && within(12 * 60, endMinutes)) {
          slotType = "morning";
        } else if (within(14 * 60, startMinutes) && within(18 * 60, endMinutes)) {
          slotType = "afternoon";
        }

        let startTimeStr = null;
        let endTimeStr = null;

        if (slotType === "custom") {
          startTimeStr = format(startTime, "HH:mm:ss");
          endTimeStr = format(endTime, "HH:mm:ss");
        }

        return {
          vacation_id: vacation.id,
          type: slotType,
          start_time: startTimeStr,
          end_time: endTimeStr,
        };
      });

      const { error: slotError } = await supabase
        .from("time_slots")
        .insert(timeSlotPayload);

      if (slotError) {
        await supabase
          .from("vacation_posts")
          .delete()
          .in("id", (insertedVacations || []).map((v) => v.id));
        throw slotError;
      }

      const createdCount = insertedVacations?.length || 0;

      setSelectedSlot({
        title: "",
        description: "",
        speciality: "general_medicine",
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

      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      logger.error("Error creating time slots", error as Error, { component: 'PlanningMedecin', action: 'create_time_slots' });
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
        if (selectedEvent.extendedProps.recurrenceGroupId) {
          const { data: vacations, error: groupError } = await supabase
            .from("vacation_posts")
            .select("id")
            .eq("recurrence_group_id", selectedEvent.extendedProps.recurrenceGroupId)
            .eq("doctor_id", doctorId);

          if (groupError) throw groupError;

          const vacationIds = (vacations || []).map((v) => v.id);

          if (vacationIds.length > 0) {
            const { error: slotDeleteError } = await supabase
              .from("time_slots")
              .delete()
              .in("vacation_id", vacationIds);

            if (slotDeleteError) throw slotDeleteError;

            const { error: deleteError } = await supabase
              .from("vacation_posts")
              .delete()
              .in("id", vacationIds);

            if (deleteError) throw deleteError;
          }
        } else {
          const { data: currentVacation, error: vacationError } = await supabase
            .from("vacation_posts")
            .select("*")
            .eq("id", selectedEvent.extendedProps.vacationId)
            .single();

          if (vacationError) throw vacationError;

          if (currentVacation) {
            let query = supabase
              .from("time_slots")
              .select(
                `
                id,
                type,
                start_time,
                end_time,
                vacation_posts!inner (
                  id,
                  doctor_id,
                  title,
                  speciality,
                  act_type
                )
              `
              )
              .eq("type", selectedEvent.extendedProps.type)
              .eq("vacation_posts.doctor_id", doctorId);

            if (selectedEvent.extendedProps.type === "custom") {
              query = query
                .eq("start_time", format(selectedEvent.start, "HH:mm:ss"))
                .eq("end_time", format(selectedEvent.end, "HH:mm:ss"));
            } else {
              query = query.is("start_time", null).is("end_time", null);
            }

            const { data: similarSlots, error: slotsError } = await query;

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
                const { error: slotDeleteError } = await supabase
                  .from("time_slots")
                  .delete()
                  .in("vacation_id", vacationIds);

                if (slotDeleteError) throw slotDeleteError;

                const { error: deleteError } = await supabase
                  .from("vacation_posts")
                  .delete()
                  .in("id", vacationIds);

                if (deleteError) throw deleteError;
              }
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

      await fetchTimeSlots();
    } catch (error) {
      logger.error("Error deleting time slot", error as Error, { component: 'PlanningMedecin', action: 'delete_time_slot' });
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
        <div ref={calendarRef} className="h-[800px] p-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
              <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 font-semibold text-lg">Chargement du planning...</span>
              </div>
            </div>
          )}
          
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            customButtons={{
              customPrev: {
                text: '‹',
                click: () => {
                  calendarRef.current?.getApi().prev();
                },
              },
              customNext: {
                text: '›',
                click: () => {
                  calendarRef.current?.getApi().next();
                },
              },
            }}
            headerToolbar={{
              left: 'customPrev,customNext today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
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
            selectOverlap={false}
            eventOverlap={false}
            scrollTime="08:00:00"
            scrollTimeReset={false}
            handleWindowResize={true}
            windowResizeDelay={100}
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
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded w-full">
                      <span className="text-yellow-800 text-sm">
                        <a
                          href="https://sante.gouv.fr/actualites/actualites-du-ministere/article/interim-medical-entree-en-vigueur-de-la-loi-rist-ce-lundi-3-avril"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold',textDecoration:'underline',cursor:'pointer',position:'relative'}}
                          title="Les tarifs des vacations sont déterminés directement par l’établissement de santé. Cureliah n’intervient pas dans leur fixation ni dans les paiements. Cliquez pour plus d'infos."
                        >
                          Tarif: voir règlementation
                        </a>
                      </span>
                    </div>
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
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <span className="text-yellow-800 text-sm">
                        <a
                          href="https://sante.gouv.fr/actualites/actualites-du-ministere/article/interim-medical-entree-en-vigueur-de-la-loi-rist-ce-lundi-3-avril"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold',textDecoration:'underline',cursor:'pointer',position:'relative'}}
                          title="Les tarifs des vacations sont déterminés directement par l’établissement de santé. Cureliah n’intervient pas dans leur fixation ni dans les paiements. Cliquez pour plus d'infos."
                        >
                          Tarif: voir règlementation
                        </a>
                      </span>
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