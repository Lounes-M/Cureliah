import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  MapPin,
  Stethoscope,
  Bell,
  Settings,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import RecentVacations from "@/components/RecentVacations";
import DashboardStats from "@/components/dashboard/DashboardStats";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DocumentManager from "@/components/documents/DocumentManager";
import ReviewsRatings from "@/components/ReviewsRatings";
import MessagingCenter from "@/components/messaging/MessagingCenter";
import { useAuth } from "@/hooks/useAuth";
import { useRecentVacations } from "@/hooks/useRecentVacations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalVacations: number;
  activeVacations: number;
  pendingVacations: number;
  completedVacations: number;
  totalBookings: number;
  todayBookings: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
  profileCompleteness: number;
}

interface TodaySchedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  status: "available" | "booked";
  bookings_count: number;
  act_type: string;
}

interface RecentActivity {
  id: string;
  type: "booking" | "review" | "vacation_created" | "vacation_updated";
  message: string;
  created_at: string;
  metadata?: any;
}

interface DoctorProfile {
  first_name?: string;
  last_name?: string;
  specialty?: string;
  avatar_url?: string;
  user_type?: "doctor" | "establishment" | "admin";
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const doctorProfile = profile as DoctorProfile;
  const { vacations, loading: vacationsLoading } = useRecentVacations();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Charger les données du dashboard
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Charger les statistiques en parallèle
      const [statsData, scheduleData, activityData] = await Promise.all([
        loadStats(),
        loadTodaySchedule(),
        loadRecentActivity(),
      ]);

      setDashboardStats(statsData);
      setTodaySchedule(scheduleData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (): Promise<DashboardStats> => {
    // 1. Statistiques des vacations
    const { data: vacationStats } = await supabase
      .from("vacation_posts")
      .select("status, hourly_rate")
      .eq("doctor_id", user.id);

    // 2. Statistiques des réservations
    const { data: bookingStats } = await supabase
      .from("bookings")
      .select(
        `
        status,
        total_amount,
        created_at,
        vacation_posts!inner(doctor_id)
      `
      )
      .eq("vacation_posts.doctor_id", user.id);

    // 3. Moyennes des avis
    const { data: reviewStats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("doctor_id", user.id);

    // 4. Profil du médecin pour calculer la complétude
    const { data: doctorProfile } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    // Calculer les statistiques
    const totalVacations = vacationStats?.length || 0;
    const activeVacations =
      vacationStats?.filter((v) => v.status === "available").length || 0;
    const pendingVacations =
      vacationStats?.filter((v) => v.status === "pending").length || 0;
    const completedVacations =
      vacationStats?.filter((v) => v.status === "completed").length || 0;

    const totalBookings = bookingStats?.length || 0;
    const todayBookings =
      bookingStats?.filter((b) => b.created_at.startsWith(today)).length || 0;

    const weeklyRevenue =
      bookingStats
        ?.filter((b) => b.created_at >= startOfWeek && b.status === "confirmed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const monthlyRevenue =
      bookingStats
        ?.filter(
          (b) => b.created_at >= startOfMonth && b.status === "confirmed"
        )
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const averageRating = reviewStats?.length
      ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
      : 0;

    const totalReviews = reviewStats?.length || 0;

    // Calculer la complétude du profil
    const profileFields = [
      "first_name",
      "last_name",
      "speciality",
      "license_number",
      "bio",
      "avatar_url",
      "experience_years",
      "hourly_rate",
    ];
    const filledFields = profileFields.filter(
      (field) => doctorProfile?.[field] && doctorProfile[field] !== ""
    ).length;
    const profileCompleteness = Math.round(
      (filledFields / profileFields.length) * 100
    );

    return {
      totalVacations,
      activeVacations,
      pendingVacations,
      completedVacations,
      totalBookings,
      todayBookings,
      weeklyRevenue,
      monthlyRevenue,
      averageRating,
      totalReviews,
      profileCompleteness,
    };
  };

  const loadTodaySchedule = async (): Promise<TodaySchedule[]> => {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("vacation_posts")
      .select(
        `
        id,
        title,
        start_date,
        end_date,
        location,
        status,
        act_type,
        time_slots(
          id,
          start_time,
          end_time,
          type
        )
      `
      )
      .eq("doctor_id", user.id)
      .gte("start_date", today)
      .lt("start_date", `${today}T23:59:59`)
      .order("start_date", { ascending: true });

    return (
      data?.map((vacation) => ({
        id: vacation.id,
        title: vacation.title,
        start_time: vacation.time_slots?.[0]?.start_time || vacation.start_date,
        end_time: vacation.time_slots?.[0]?.end_time || vacation.end_date,
        location: vacation.location,
        status: vacation.status as "available" | "booked",
        bookings_count: 0, // TODO: Ajouter le count des bookings
        act_type: vacation.act_type,
      })) || []
    );
  };

  const loadRecentActivity = async (): Promise<RecentActivity[]> => {
    const activities: RecentActivity[] = [];

    // Récentes réservations
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select(
        `
        id,
        created_at,
        status,
        vacation_posts!inner(
          title,
          doctor_id
        )
      `
      )
      .eq("vacation_posts.doctor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    recentBookings?.forEach((booking: any) => {
      activities.push({
        id: `booking_${booking.id}`,
        type: "booking",
        message: `Nouvelle réservation pour "${booking.vacation_posts.title}"`,
        created_at: booking.created_at,
        metadata: booking,
      });
    });

    // Récents avis
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("id, created_at, rating, comment")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    recentReviews?.forEach((review) => {
      activities.push({
        id: `review_${review.id}`,
        type: "review",
        message: `Nouvel avis ${review.rating} étoiles reçu`,
        created_at: review.created_at,
        metadata: review,
      });
    });

    // Récentes vacations créées
    const { data: recentVacations } = await supabase
      .from("vacation_posts")
      .select("id, created_at, title, status")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    recentVacations?.forEach((vacation) => {
      activities.push({
        id: `vacation_${vacation.id}`,
        type: "vacation_created",
        message: `Vacation "${vacation.title}" créée`,
        created_at: vacation.created_at,
        metadata: vacation,
      });
    });

    // Trier par date de création (plus récent en premier)
    return activities
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 8);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "review":
        return Star;
      case "vacation_created":
        return Plus;
      case "vacation_updated":
        return Activity;
      default:
        return Bell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "booking":
        return "text-blue-600";
      case "review":
        return "text-yellow-600";
      case "vacation_created":
        return "text-green-600";
      case "vacation_updated":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440)
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  const quickActions = [
    {
      title: "Créer une vacation",
      description: "Ajouter une nouvelle disponibilité",
      icon: Plus,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      action: () => navigate("/doctor/manage-vacations"),
    },
    {
      title: "Gérer mon planning",
      description: "Voir et modifier mes créneaux",
      icon: Calendar,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      action: () => navigate("/doctor/manage-vacations"),
    },
    {
      title: "Mes réservations",
      description: "Consulter les réservations actives",
      icon: Users,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      action: () => navigate("/bookings"),
    },
    {
      title: "Messages patients",
      description: "Répondre aux messages",
      icon: MessageSquare,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      action: () => setActiveTab("messages"),
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Accès restreint
            </div>
            <div className="text-gray-600">
              Veuillez vous connecter pour accéder au tableau de bord
            </div>
            <Button onClick={() => navigate("/auth")} className="mt-4">
              Se connecter
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête du dashboard */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                <AvatarImage src={doctorProfile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                  {doctorProfile?.first_name?.[0] || "D"}
                  {doctorProfile?.last_name?.[0] || "R"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bonjour, Dr{" "}
                  {doctorProfile?.last_name || user.email?.split("@")[0]}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  {doctorProfile?.specialty || "Médecin généraliste"}
                </p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {currentTime.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile/complete")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profil
              </Button>
              <Button
                onClick={() => navigate("/doctor/manage-vacations")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle vacation
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm border shadow-sm">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Avis</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium mb-1">
                            Vacations actives
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {dashboardStats?.activeVacations || 0}
                          </p>
                          <p className="text-xs text-blue-700">
                            sur {dashboardStats?.totalVacations || 0} total
                          </p>
                        </div>
                        <div className="bg-blue-600 p-3 rounded-xl">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium mb-1">
                            Revenus du mois
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {dashboardStats?.monthlyRevenue?.toFixed(0) || 0}€
                          </p>
                          <p className="text-xs text-green-700">
                            Semaine:{" "}
                            {dashboardStats?.weeklyRevenue?.toFixed(0) || 0}€
                          </p>
                        </div>
                        <div className="bg-green-600 p-3 rounded-xl">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium mb-1">
                            Note moyenne
                          </p>
                          <p className="text-2xl font-bold text-yellow-900 flex items-center">
                            {dashboardStats?.averageRating?.toFixed(1) || "0.0"}
                            <Star className="w-5 h-5 text-yellow-500 ml-1" />
                          </p>
                          <p className="text-xs text-yellow-700">
                            {dashboardStats?.totalReviews || 0} avis
                          </p>
                        </div>
                        <div className="bg-yellow-600 p-3 rounded-xl">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium mb-1">
                            Profil complété
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {dashboardStats?.profileCompleteness || 0}%
                          </p>
                          <Progress
                            value={dashboardStats?.profileCompleteness || 0}
                            className="w-16 h-1 mt-2"
                          />
                        </div>
                        <div className="bg-purple-600 p-3 rounded-xl">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions rapides */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center space-y-3 hover:shadow-md transition-all border-dashed hover:border-solid"
                          onClick={action.action}
                        >
                          <div className={`p-3 rounded-xl ${action.color}`}>
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm">
                              {action.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {action.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Planning du jour */}
                  <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Planning d'aujourd'hui
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/doctor/manage-vacations")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir tout
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {todaySchedule.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucune vacation programmée aujourd'hui</p>
                          <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => navigate("/doctor/create-vacation")}
                          >
                            Créer une vacation
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {todaySchedule.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Stethoscope className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {schedule.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {schedule.start_time} - {schedule.end_time}
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {schedule.location}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    schedule.status === "available"
                                      ? "secondary"
                                      : "default"
                                  }
                                >
                                  {schedule.status === "available"
                                    ? "Disponible"
                                    : "Réservé"}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {schedule.act_type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activité récente */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Activité récente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Aucune activité récente</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivity.map((activity) => {
                            const IconComponent = getActivityIcon(
                              activity.type
                            );
                            return (
                              <div
                                key={activity.id}
                                className="flex items-start space-x-3"
                              >
                                <div
                                  className={`flex-shrink-0 ${getActivityColor(
                                    activity.type
                                  )}`}
                                >
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900">
                                    {activity.message}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatTimeAgo(activity.created_at)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Vacations récentes */}
                <RecentVacations
                  vacations={vacations}
                  title="Mes vacations récentes"
                  emptyMessage="Aucune vacation trouvée"
                  onViewAll={() => navigate("/doctor/manage-vacations")}
                  showActions={true}
                  onActionClick={(vacation) =>
                    navigate(`/doctor/vacation/${vacation.id}`)
                  }
                  actionLabel="Voir détails"
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="messages">
            <MessagingCenter />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsRatings targetId={user.id} targetType="doctor" />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
