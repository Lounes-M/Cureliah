import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Euro,
  Settings,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Copy,
  Save,
  X,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  speciality: string;
  hourly_rate?: number;
  status: "available" | "booked" | "blocked" | "draft";
  color?: string;
  description?: string;
  recurring?: boolean;
  recurring_pattern?: "daily" | "weekly" | "monthly";
  recurring_end?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

type ViewMode = "month" | "week" | "day";

const DoctorCalendar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Form state pour création/édition d'événement
  const [eventForm, setEventForm] = useState({
    title: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    speciality: "general",
    hourly_rate: "",
    description: "",
    recurring: false,
    recurring_pattern: "weekly" as "daily" | "weekly" | "monthly",
    recurring_end: "",
  });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth?type=doctor");
      return;
    }
    fetchEvents();
  }, [user, profile, navigate]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, events, viewMode]);

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vacation_posts")
        .select("*")
        .eq("doctor_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (data || []).map((vacation: any) => ({
        id: vacation.id,
        title: vacation.title,
        start_date: vacation.start_date,
        end_date: vacation.end_date,
        start_time: vacation.start_time,
        end_time: vacation.end_time,
        location: vacation.location,
        speciality: vacation.speciality,
        hourly_rate: vacation.hourly_rate,
        status: vacation.status,
        description: vacation.description,
        color: getEventColor(vacation.status),
        recurring: vacation.recurring || false,
        recurring_pattern: vacation.recurring_pattern,
        recurring_end: vacation.recurring_end,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "booked":
        return "bg-blue-500";
      case "blocked":
        return "bg-red-500";
      case "draft":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    
    // Premier lundi de la grille (peut être du mois précédent)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Générer 42 jours (6 semaines)
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        events: dayEvents,
      });
    }
    
    setCalendarDays(days);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const openEventModal = (date?: Date, event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        location: event.location || "",
        speciality: event.speciality,
        hourly_rate: event.hourly_rate?.toString() || "",
        description: event.description || "",
        recurring: event.recurring || false,
        recurring_pattern: event.recurring_pattern || "weekly",
        recurring_end: event.recurring_end || "",
      });
    } else {
      setEditingEvent(null);
      const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setEventForm({
        title: "",
        start_date: dateStr,
        end_date: dateStr,
        start_time: "",
        end_time: "",
        location: "",
        speciality: "general",
        hourly_rate: "",
        description: "",
        recurring: false,
        recurring_pattern: "weekly",
        recurring_end: "",
      });
    }
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({
      title: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      speciality: "general",
      hourly_rate: "",
      description: "",
      recurring: false,
      recurring_pattern: "weekly",
      recurring_end: "",
    });
  };

  const saveEvent = async () => {
    if (!user || !eventForm.title || !eventForm.start_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const eventData = {
        title: eventForm.title,
        start_date: eventForm.start_date,
        end_date: eventForm.end_date || eventForm.start_date,
        start_time: eventForm.start_time || null,
        end_time: eventForm.end_time || null,
        location: eventForm.location || null,
        speciality: eventForm.speciality,
        hourly_rate: eventForm.hourly_rate ? parseFloat(eventForm.hourly_rate) : null,
        description: eventForm.description || null,
        recurring: eventForm.recurring,
        recurring_pattern: eventForm.recurring ? eventForm.recurring_pattern : null,
        recurring_end: eventForm.recurring && eventForm.recurring_end ? eventForm.recurring_end : null,
        doctor_id: user.id,
        status: "draft",
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("vacation_posts")
          .update(eventData)
          .eq("id", editingEvent.id);
        
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Événement modifié avec succès",
        });
      } else {
        const { error } = await supabase
          .from("vacation_posts")
          .insert(eventData);
        
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Événement créé avec succès",
        });
      }

      closeEventModal();
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'événement",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("vacation_posts")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Événement supprimé avec succès",
      });

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive",
      });
    }
  };

  const exportCalendar = () => {
    // Génération d'un fichier iCal
    const icalData = events.map(event => {
      return [
        "BEGIN:VEVENT",
        `UID:${event.id}`,
        `DTSTART:${event.start_date.replace(/-/g, "")}`,
        `DTEND:${event.end_date.replace(/-/g, "")}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ""}`,
        `LOCATION:${event.location || ""}`,
        "END:VEVENT"
      ].join("\\r\\n");
    }).join("\\r\\n");

    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cureliah//Calendar//FR",
      icalData,
      "END:VCALENDAR"
    ].join("\\r\\n");

    const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cureliah-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Succès",
      description: "Calendrier exporté avec succès",
    });
  };

  if (!user || profile?.user_type !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor/dashboard")}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mon calendrier
              </h1>
              <p className="text-gray-600">
                Planifiez et gérez vos vacations dans une vue calendrier
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={exportCalendar} className="border-gray-300 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button 
                onClick={() => openEventModal(selectedDate || new Date())}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle vacation
              </Button>
            </div>
          </div>
        </div>

        {/* Contrôles du calendrier */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-semibold min-w-[200px] text-center">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={navigateToToday}>
                  Aujourd'hui
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="month">Mois</TabsTrigger>
                    <TabsTrigger value="week">Semaine</TabsTrigger>
                    <TabsTrigger value="day">Jour</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Réservé</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Bloqué</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span>Brouillon</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Vue calendrier */}
        <Card>
          <CardContent className="p-0">
            {viewMode === "month" && (
              <div className="grid grid-cols-7 gap-0">
                {/* En-têtes des jours */}
                {weekDays.map((day) => (
                  <div key={day} className="p-4 text-center font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200">
                    {day}
                  </div>
                ))}
                
                {/* Jours du calendrier */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !day.isCurrentMonth ? "bg-gray-50/50 text-gray-400" : ""
                    } ${
                      day.isToday ? "bg-blue-50" : ""
                    } ${
                      day.isSelected ? "bg-blue-100" : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(day.date);
                      openEventModal(day.date);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${day.isToday ? "text-blue-600" : ""}`}>
                        {day.date.getDate()}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1 rounded text-white truncate ${event.color}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(undefined, event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{day.events.length - 2} autres
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "week" && (
              <div className="p-6">
                <div className="text-center text-gray-500">
                  Vue semaine - En cours de développement
                </div>
              </div>
            )}

            {viewMode === "day" && (
              <div className="p-6">
                <div className="text-center text-gray-500">
                  Vue jour - En cours de développement
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal d'événement */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Modifier la vacation" : "Nouvelle vacation"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Modifiez les détails de cette vacation" : "Créez une nouvelle vacation dans votre calendrier"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Titre de la vacation *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Nom de la vacation"
                />
              </div>

              <div>
                <Label htmlFor="start_date">Date de début *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="start_time">Heure de début</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_time">Heure de fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
              </div>
            </div>

            {/* Détails */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Adresse ou nom de l'établissement"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="speciality">Spécialité</Label>
                  <Select value={eventForm.speciality} onValueChange={(value) => setEventForm({ ...eventForm, speciality: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Médecine générale</SelectItem>
                      <SelectItem value="cardiology">Cardiologie</SelectItem>
                      <SelectItem value="orthopedics">Orthopédie</SelectItem>
                      <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                      <SelectItem value="dermatology">Dermatologie</SelectItem>
                      <SelectItem value="psychiatry">Psychiatrie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={eventForm.hourly_rate}
                    onChange={(e) => setEventForm({ ...eventForm, hourly_rate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Détails supplémentaires sur cette vacation..."
                  rows={3}
                />
              </div>
            </div>

            {/* Options de récurrence */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={eventForm.recurring}
                  onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="recurring">Récurrence</Label>
              </div>

              {eventForm.recurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="recurring_pattern">Fréquence</Label>
                    <Select value={eventForm.recurring_pattern} onValueChange={(value: any) => setEventForm({ ...eventForm, recurring_pattern: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurring_end">Fin de récurrence</Label>
                    <Input
                      id="recurring_end"
                      type="date"
                      value={eventForm.recurring_end}
                      onChange={(e) => setEventForm({ ...eventForm, recurring_end: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              {editingEvent && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteEvent(editingEvent.id);
                    closeEventModal();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
              <Button variant="outline" onClick={closeEventModal}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={saveEvent}>
                <Save className="w-4 h-4 mr-2" />
                {editingEvent ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorCalendar;
