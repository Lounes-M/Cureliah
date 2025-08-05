import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import { PlanningMedecin } from "@/components/vacation/PlanningMedecin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Plus,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Euro,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface VacationStats {
  totalVacations: number;
  availableSlots: number;
  bookedSlots: number;
  totalEarnings: number;
  upcomingVacations: number;
  pendingRequests: number;
}

const ManageVacations = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const logger = useLogger();
  const [stats, setStats] = useState<VacationStats>({
    totalVacations: 0,
    availableSlots: 0,
    bookedSlots: 0,
    totalEarnings: 0,
    upcomingVacations: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [vacations, setVacations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth?type=doctor");
      return;
    }
    fetchStats();
  }, [user, profile, navigate]);

  // Charger toutes les vacations du médecin
  const fetchVacations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("vacation_posts")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setVacations(data);
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer les vacations du médecin
      const { data: vacations, error: vacationsError } = await supabase
        .from("vacation_posts")
        .select(
          `
          id,
          status,
          hourly_rate,
          start_date,
          end_date,
          time_slots (
            id,
            type,
            vacation_availability (
              id,
              is_available,
              date
            )
          )
        `
        )
        .eq("doctor_id", user.id);

      if (vacationsError) throw vacationsError;

      let pendingRequests = 0;
      if (vacations && vacations.length > 0) {
        const vacationIds = vacations.map((v: any) => v.id);
        // Récupérer le nombre de bookings en attente pour ces vacations
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("id, status, vacation_post_id")
          .in("vacation_post_id", vacationIds);
        if (bookingsError) throw bookingsError;
        pendingRequests = (bookings || []).filter((b: any) => b.status === "pending").length;
      }

      if (vacations) {
        const now = new Date();
        const totalVacations = vacations.length;
        let availableSlots = 0;
        let bookedSlots = 0;
        let totalEarnings = 0;
        let upcomingVacations = 0;

        vacations.forEach((vacation) => {
          const startDate = new Date(vacation.start_date);

          if (startDate > now) {
            upcomingVacations++;
          }

          if (vacation.status === "available") {
            availableSlots++;
          } else if (vacation.status === "booked") {
            bookedSlots++;
            totalEarnings += vacation.hourly_rate || 0;
          }
        });

        setStats({
          totalVacations,
          availableSlots,
          bookedSlots,
          totalEarnings,
          upcomingVacations,
          pendingRequests,
        });
      }
    } catch (error) {
      logger.error("Error fetching stats", error as Error, { userId: user?.id }, 'ManageVacations', 'fetch_stats_error');
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotCreated = () => {
    toast({
      title: "Succès",
      description: "Le créneau a été créé avec succès",
    });
    fetchStats(); // Rafraîchir les stats
  };

  const handleSlotUpdated = () => {
    toast({
      title: "Succès",
      description: "Le créneau a été mis à jour avec succès",
    });
    fetchStats(); // Rafraîchir les stats
  };

  // Suppression d'une vacation (brouillon ou autre)
  const handleDeleteVacation = async (vacationId: string) => {
    if (!window.confirm("Supprimer cette vacation ?")) return;
    const { error } = await supabase
      .from("vacation_posts")
      .delete()
      .eq("id", vacationId);
    if (!error) {
      setVacations((prev) => prev.filter((v) => v.id !== vacationId));
      toast({ title: "Supprimé", description: "Vacation supprimée." });
    } else {
      toast({ title: "Erreur", description: "Suppression impossible.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  if (!user || profile?.user_type !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec navigation */}
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
                Gérer mes disponibilités
              </h1>
              <p className="text-gray-600">
                Planifiez vos vacations et gérez vos créneaux de disponibilité
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/doctor/vacation/reports")}
                className="border-gray-300 hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Rapports
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total vacations
                </CardTitle>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalVacations}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Créneaux disponibles
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : stats.availableSlots}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Créneaux réservés
                </CardTitle>
                <Users className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? "..." : stats.bookedSlots}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Revenus totaux
                </CardTitle>
                <Euro className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : `${stats.totalEarnings}€`}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Vacations à venir
                </CardTitle>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : stats.upcomingVacations}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Demandes en attente
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-amber-600">
                {loading ? "..." : stats.pendingRequests}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes/Notifications */}
        {stats.upcomingVacations > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    Vacations à venir
                  </div>
                  <div className="text-sm text-blue-700">
                    Vous avez {stats.upcomingVacations} vacation(s) planifiée(s)
                    prochainement.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planning principal */}
        <div className="mt-8">
          <PlanningMedecin
            doctorId={user.id}
            onSlotCreated={handleSlotCreated}
            onSlotUpdated={handleSlotUpdated}
          />
        </div>

        {/* Liste des vacations */}
        <Card className="mt-12 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Mes vacations
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Gérez et suivez toutes vos vacations en un seul endroit
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {vacations.filter(v => statusFilter === "all" || v.status === statusFilter).length} vacation(s)
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Filtres améliorés */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Toutes", icon: "📋", count: vacations.length },
                  { key: "draft", label: "Brouillons", icon: "📝", count: vacations.filter(v => v.status === "draft").length },
                  { key: "available", label: "Disponibles", icon: "✅", count: vacations.filter(v => v.status === "available").length },
                  { key: "booked", label: "Réservées", icon: "📅", count: vacations.filter(v => v.status === "booked").length },
                  { key: "completed", label: "Terminées", icon: "✔️", count: vacations.filter(v => v.status === "completed").length },
                  { key: "cancelled", label: "Annulées", icon: "❌", count: vacations.filter(v => v.status === "cancelled").length },
                  { key: "pending", label: "En attente", icon: "⏳", count: vacations.filter(v => v.status === "pending").length }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={statusFilter === filter.key ? "default" : "outline"}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`text-sm transition-all duration-200 ${
                      statusFilter === filter.key 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <span className="mr-2">{filter.icon}</span>
                    {filter.label}
                    {filter.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${
                          statusFilter === filter.key 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {filter.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Liste des vacations améliorée */}
            <div className="space-y-4">
              {vacations
                .filter((v) => statusFilter === "all" || v.status === statusFilter)
                .map((vacation) => (
                  <Card 
                    key={vacation.id} 
                    className="transition-all duration-200 hover:shadow-md hover:scale-[1.01] border border-gray-200 bg-gradient-to-r from-white to-gray-50/30"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg text-gray-900 truncate">
                                  {vacation.title}
                                </h3>
                                <Badge 
                                  className={`${
                                    vacation.status === "draft"
                                      ? "bg-gray-100 text-gray-800 border-gray-200"
                                      : vacation.status === "available"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : vacation.status === "booked"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : vacation.status === "completed"
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : vacation.status === "cancelled"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : vacation.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                  } font-medium`}
                                >
                                  {vacation.status === "draft"
                                    ? "📝 Brouillon"
                                    : vacation.status === "available"
                                    ? "✅ Disponible"
                                    : vacation.status === "booked"
                                    ? "📅 Réservé"
                                    : vacation.status === "completed"
                                    ? "✔️ Terminé"
                                    : vacation.status === "cancelled"
                                    ? "❌ Annulé"
                                    : vacation.status === "pending"
                                    ? "⏳ En attente"
                                    : "❓ Non spécifié"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{vacation.start_date} → {vacation.end_date}</span>
                                </div>
                                {vacation.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{vacation.location}</span>
                                  </div>
                                )}
                                {vacation.hourly_rate && (
                                  <div className="flex items-center gap-1">
                                    <Euro className="w-4 h-4" />
                                    <span>{vacation.hourly_rate}€/h</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/doctor/vacation/${vacation.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            👁️ Voir
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/doctor/vacation/${vacation.id}/edit`)}
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            ✏️ Éditer
                          </Button>
                          {vacation.status === "draft" && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteVacation(vacation.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              🗑️ Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {vacations.filter((v) => statusFilter === "all" || v.status === statusFilter).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune vacation trouvée
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {statusFilter === "all" 
                      ? "Vous n'avez pas encore créé de vacation. Commencez par ajouter votre première vacation !" 
                      : `Aucune vacation avec le statut "${statusFilter === "draft" ? "brouillon" : statusFilter}".`
                    }
                  </p>
                  {statusFilter === "all" && (
                    <Button 
                      onClick={() => navigate("/doctor/create-vacation")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer ma première vacation
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageVacations;
