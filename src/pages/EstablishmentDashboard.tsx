// Nous devons étendre l'interface User pour inclure les propriétés de l'établissement
interface ExtendedProfile {
  establishment_name?: string;
  logo_url?: string;
  type?: string;
  user_type?: "doctor" | "establishment" | "admin";
}
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
  Building2,
  Bell,
  Settings,
  Download,
  BarChart3,
  Loader2,
  Search,
  UserCheck,
  CreditCard,
  Hospital,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DocumentManager from "@/components/documents/DocumentManager";
import ReviewsRatings from "@/components/ReviewsRatings";
import MessagingCenter from "@/components/messaging/MessagingCenter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface EstablishmentStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalSpent: number;
  monthlySpent: number;
  weeklySpent: number;
  averageRating: number;
  totalReviews: number;
  profileCompleteness: number;
  partneredDoctors: number;
  upcomingBookings: number;
}

interface RecentBooking {
  id: string;
  doctor_name: string;
  doctor_speciality: string;
  vacation_title: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  location: string;
  doctor_avatar: string;
}

interface PartnerDoctor {
  id: string;
  first_name: string;
  last_name: string;
  speciality: string;
  avatar_url: string;
  average_rating: number;
  total_reviews: number;
  hourly_rate: number;
  total_bookings: number;
}

interface RecentActivity {
  id: string;
  type:
    | "booking_created"
    | "booking_confirmed"
    | "booking_completed"
    | "review_given"
    | "payment_processed";
  message: string;
  created_at: string;
  metadata?: any;
}

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  // Convertir le profil en profil étendu pour les établissements
  const extendedProfile = profile as ExtendedProfile;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [establishmentStats, setEstablishmentStats] =
    useState<EstablishmentStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [partnerDoctors, setPartnerDoctors] = useState<PartnerDoctor[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

      // Charger les données en parallèle
      const [statsData, bookingsData, doctorsData, activityData] =
        await Promise.all([
          loadStats(),
          loadRecentBookings(),
          loadPartnerDoctors(),
          loadRecentActivity(),
        ]);

      setEstablishmentStats(statsData);
      setRecentBookings(bookingsData);
      setPartnerDoctors(doctorsData);
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

  const loadStats = async (): Promise<EstablishmentStats> => {
    // 1. Statistiques des réservations
    const { data: bookingStats } = await supabase
      .from("bookings")
      .select(
        `
      status,
      total_amount,
      created_at,
      start_date,
      vacation_posts!inner(doctor_id)
    `
      )
      .eq("establishment_id", user.id);

    // 2. Moyennes des avis donnés par l'établissement
    const { data: reviewStats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("establishment_id", user.id);

    // 3. Profil de l'établissement pour calculer la complétude
    const { data: establishmentProfile } = await supabase
      .from("establishment_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 4. Docteurs partenaires (ayant eu au moins une réservation)
    const { data: partneredDoctorsData } = await supabase
      .from("bookings")
      .select(
        `
      vacation_posts!inner(
        doctor_id,
        doctor_profiles!inner(id)
      )
    `
      )
      .eq("establishment_id", user.id);

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
    const totalBookings = bookingStats?.length || 0;
    const activeBookings =
      bookingStats?.filter((b) => b.status === "confirmed").length || 0;
    const completedBookings =
      bookingStats?.filter((b) => b.status === "completed").length || 0;
    const pendingBookings =
      bookingStats?.filter((b) => b.status === "pending").length || 0;
    const upcomingBookings =
      bookingStats?.filter(
        (b) => b.status === "confirmed" && b.start_date >= today
      ).length || 0;

    const totalSpent =
      bookingStats
        ?.filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const weeklySpent =
      bookingStats
        ?.filter((b) => b.created_at >= startOfWeek && b.status === "completed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const monthlySpent =
      bookingStats
        ?.filter(
          (b) => b.created_at >= startOfMonth && b.status === "completed"
        )
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const averageRating = reviewStats?.length
      ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
      : 0;

    const totalReviews = reviewStats?.length || 0;

    // Calculer la complétude du profil
    const profileFields = [
      "name",
      "type",
      "address",
      "phone",
      "email",
      "description",
      "logo_url",
      "website",
    ];
    const filledFields = profileFields.filter(
      (field) =>
        establishmentProfile?.[field] && establishmentProfile[field] !== ""
    ).length;
    const profileCompleteness = Math.round(
      (filledFields / profileFields.length) * 100
    );

    // Nombre de docteurs partenaires uniques
    const uniqueDoctorIds = new Set(
      partneredDoctorsData?.map((b: any) => b.vacation_posts.doctor_id) || []
    );
    const partneredDoctors = uniqueDoctorIds.size;

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      pendingBookings,
      upcomingBookings,
      totalSpent,
      weeklySpent,
      monthlySpent,
      averageRating,
      totalReviews,
      profileCompleteness,
      partneredDoctors,
    };
  };

  const loadRecentBookings = async (): Promise<RecentBooking[]> => {
    const { data } = await supabase
      .from("bookings")
      .select(
        `
      id,
      status,
      total_amount,
      start_date,
      end_date,
      vacation_posts!inner(
        title,
        location,
        doctor_profiles!inner(
          first_name,
          last_name,
          speciality,
          avatar_url
        )
      )
    `
      )
      .eq("establishment_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return (
      data?.map((booking: any) => ({
        id: booking.id,
        doctor_name: `${booking.vacation_posts.doctor_profiles.first_name} ${booking.vacation_posts.doctor_profiles.last_name}`,
        doctor_speciality: booking.vacation_posts.doctor_profiles.speciality,
        doctor_avatar: booking.vacation_posts.doctor_profiles.avatar_url,
        vacation_title: booking.vacation_posts.title,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_amount: booking.total_amount,
        location: booking.vacation_posts.location,
      })) || []
    );
  };

  const loadPartnerDoctors = async (): Promise<PartnerDoctor[]> => {
    // Récupérer les docteurs avec qui l'établissement a travaillé
    const { data: bookingsWithDoctors } = await supabase
      .from("bookings")
      .select(
        `
      vacation_posts!inner(
        doctor_id,
        doctor_profiles!inner(
          id,
          first_name,
          last_name,
          speciality,
          avatar_url,
          hourly_rate
        )
      ),
      total_amount,
      status
    `
      )
      .eq("establishment_id", user.id);

    // Grouper par docteur et calculer les statistiques
    const doctorStats = new Map();

    bookingsWithDoctors?.forEach((booking: any) => {
      const doctorId = booking.vacation_posts.doctor_id;
      const doctor = booking.vacation_posts.doctor_profiles;

      if (!doctorStats.has(doctorId)) {
        doctorStats.set(doctorId, {
          id: doctorId,
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          speciality: doctor.speciality,
          avatar_url: doctor.avatar_url,
          hourly_rate: doctor.hourly_rate,
          total_bookings: 0,
          total_amount: 0,
          average_rating: 0,
          total_reviews: 0,
        });
      }

      const stats = doctorStats.get(doctorId);
      stats.total_bookings += 1;
      if (booking.status === "completed") {
        stats.total_amount += booking.total_amount || 0;
      }
    });

    // Récupérer les avis pour chaque docteur
    for (const [doctorId, stats] of doctorStats) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("doctor_id", doctorId);

      if (reviews && reviews.length > 0) {
        stats.average_rating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        stats.total_reviews = reviews.length;
      }
    }

    return Array.from(doctorStats.values()).slice(0, 6);
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
        doctor_profiles!inner(
          first_name,
          last_name
        )
      )
    `
      )
      .eq("establishment_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    recentBookings?.forEach((booking: any) => {
      const doctorName = `${booking.vacation_posts.doctor_profiles.first_name} ${booking.vacation_posts.doctor_profiles.last_name}`;
      let message = "";
      let type: RecentActivity["type"] = "booking_created";

      switch (booking.status) {
        case "pending":
          message = `Réservation créée avec Dr ${doctorName}`;
          type = "booking_created";
          break;
        case "confirmed":
          message = `Réservation confirmée avec Dr ${doctorName}`;
          type = "booking_confirmed";
          break;
        case "completed":
          message = `Mission terminée avec Dr ${doctorName}`;
          type = "booking_completed";
          break;
      }

      activities.push({
        id: `booking_${booking.id}`,
        type,
        message,
        created_at: booking.created_at,
        metadata: booking,
      });
    });

    // Récents avis donnés
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select(
        `
      id,
      created_at,
      rating,
      doctor_profiles!inner(
        first_name,
        last_name
      )
    `
      )
      .eq("establishment_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    recentReviews?.forEach((review: any) => {
      const doctorName = `${review.doctor_profiles.first_name} ${review.doctor_profiles.last_name}`;
      activities.push({
        id: `review_${review.id}`,
        type: "review_given",
        message: `Avis ${review.rating} étoiles donné à Dr ${doctorName}`,
        created_at: review.created_at,
        metadata: review,
      });
    });

    return activities
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 8);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking_created":
        return Plus;
      case "booking_confirmed":
        return CheckCircle2;
      case "booking_completed":
        return Calendar;
      case "review_given":
        return Star;
      case "payment_processed":
        return CreditCard;
      default:
        return Bell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "booking_created":
        return "text-blue-600";
      case "booking_confirmed":
        return "text-green-600";
      case "booking_completed":
        return "text-purple-600";
      case "review_given":
        return "text-yellow-600";
      case "payment_processed":
        return "text-emerald-600";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmée";
      case "completed":
        return "Terminée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const quickActions = [
    {
      title: "Rechercher des médecins",
      description: "Trouver des professionnels de santé",
      icon: Search,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      action: () => navigate("/search"),
    },
    {
      title: "Mes réservations",
      description: "Consulter les réservations en cours",
      icon: Calendar,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      action: () => navigate("/bookings"),
    },
    {
      title: "Médecins partenaires",
      description: "Voir mes médecins favoris",
      icon: UserCheck,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      action: () => setActiveTab("doctors"),
    },
    {
      title: "Messages",
      description: "Communiquer avec les médecins",
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

  // Check if user is establishment
  if (profile && profile.user_type !== "establishment") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Accès réservé aux établissements
            </div>
            <div className="text-gray-600">
              Votre compte n'a pas les permissions nécessaires
            </div>
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
                <AvatarImage src={extendedProfile?.logo_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                  {(extendedProfile?.establishment_name || "E")[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bonjour,{" "}
                  {extendedProfile?.establishment_name || "Établissement"}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Hospital className="w-4 h-4 mr-2" />
                  {extendedProfile?.type || "Établissement de santé"}
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
                onClick={() => navigate("/search")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher des médecins
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm border shadow-sm">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger
              value="doctors"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Médecins</span>
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
                            Réservations actives
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {establishmentStats?.activeBookings || 0}
                          </p>
                          <p className="text-xs text-blue-700">
                            {establishmentStats?.upcomingBookings || 0} à venir
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
                            Dépenses du mois
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {establishmentStats?.monthlySpent?.toFixed(0) || 0}€
                          </p>
                          <p className="text-xs text-green-700">
                            Total:{" "}
                            {establishmentStats?.totalSpent?.toFixed(0) || 0}€
                          </p>
                        </div>
                        <div className="bg-green-600 p-3 rounded-xl">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium mb-1">
                            Médecins partenaires
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {establishmentStats?.partneredDoctors || 0}
                          </p>
                          <p className="text-xs text-purple-700">
                            Collaborations actives
                          </p>
                        </div>
                        <div className="bg-purple-600 p-3 rounded-xl">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium mb-1">
                            Profil complété
                          </p>
                          <p className="text-2xl font-bold text-orange-900">
                            {establishmentStats?.profileCompleteness || 0}%
                          </p>
                          <Progress
                            value={establishmentStats?.profileCompleteness || 0}
                            className="w-16 h-1 mt-2"
                          />
                        </div>
                        <div className="bg-orange-600 p-3 rounded-xl">
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
                  {/* Réservations récentes */}
                  <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Réservations récentes
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/bookings")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir tout
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {recentBookings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucune réservation récente</p>
                          <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => navigate("/search")}
                          >
                            Rechercher des médecins
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => navigate(`/booking/${booking.id}`)}
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={booking.doctor_avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                    {booking.doctor_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    Dr {booking.doctor_name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {booking.doctor_speciality}
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {booking.location}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  {getStatusLabel(booking.status)}
                                </Badge>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                  {booking.total_amount}€
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    booking.start_date
                                  ).toLocaleDateString("fr-FR")}
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

                {/* Médecins partenaires */}
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Médecins partenaires
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("doctors")}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir tout
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {partnerDoctors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun médecin partenaire</p>
                        <Button
                          variant="outline"
                          className="mt-3"
                          onClick={() => navigate("/search")}
                        >
                          Rechercher des médecins
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {partnerDoctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                            onClick={() => navigate(`/doctor/${doctor.id}`)}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={doctor.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                  {doctor.first_name[0]}
                                  {doctor.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  Dr {doctor.first_name} {doctor.last_name}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {doctor.speciality}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span>
                                  {doctor.average_rating?.toFixed(1) || "N/A"}
                                </span>
                                <span className="text-gray-500 ml-1">
                                  ({doctor.total_reviews})
                                </span>
                              </div>
                              <div className="text-gray-600">
                                {doctor.total_bookings} mission
                                {doctor.total_bookings > 1 ? "s" : ""}
                              </div>
                            </div>
                            {doctor.hourly_rate && (
                              <div className="mt-2 text-sm font-medium text-green-600">
                                {doctor.hourly_rate}€/h
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Mes médecins partenaires
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Rechercher un médecin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {partnerDoctors.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun médecin partenaire
                    </h3>
                    <p className="mb-4">
                      Commencez par rechercher et réserver des médecins pour
                      créer votre réseau de partenaires.
                    </p>
                    <Button onClick={() => navigate("/search")}>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher des médecins
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {partnerDoctors
                      .filter(
                        (doctor) =>
                          searchTerm === "" ||
                          `${doctor.first_name} ${doctor.last_name}`
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          doctor.speciality
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      )
                      .map((doctor) => (
                        <Card
                          key={doctor.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/doctor/${doctor.id}`)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={doctor.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                                  {doctor.first_name[0]}
                                  {doctor.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  Dr {doctor.first_name} {doctor.last_name}
                                </h3>
                                <p className="text-gray-600">
                                  {doctor.speciality}
                                </p>
                                <div className="flex items-center mt-2">
                                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                  <span className="text-sm">
                                    {doctor.average_rating?.toFixed(1) || "N/A"}
                                    <span className="text-gray-500 ml-1">
                                      ({doctor.total_reviews} avis)
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Missions réalisées :
                                </span>
                                <Badge variant="secondary">
                                  {doctor.total_bookings}
                                </Badge>
                              </div>

                              {doctor.hourly_rate && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Tarif horaire :
                                  </span>
                                  <span className="font-medium text-green-600">
                                    {doctor.hourly_rate}€/h
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2 mt-4">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/doctor/${doctor.id}`);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir profil
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to messaging or contact
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <MessagingCenter />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsRatings targetId={user.id} targetType="establishment" />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
