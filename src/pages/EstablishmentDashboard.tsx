// Nous devons étendre l'interface User pour inclure les propriétés de l'établissement
interface ExtendedProfile {
  establishment_name?: string;
  logo_url?: string;
  type?: string;
  user_type?: "doctor" | "establishment" | "admin";
}

// Ajoutez cette interface pour les détails de vacation
interface VacationDetails {
  id: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  payment_status?: string;
  vacation_posts: {
    id: string;
    title: string;
    description: string;
    speciality: string;
    location: string;
    requirements: string;
    act_type: string;
    hourly_rate: number;
    doctor_profiles: {
      id: string;
      first_name: string;
      last_name: string;
      speciality: string;
      avatar_url: string;
      bio: string;
      experience_years: number;
      license_number: string;
      education: string[];
      languages: string[];
    };
  };
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogger } from "@/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Euro,
  Stethoscope,
  Sparkles,
  X,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DocumentManager from "@/components/documents/DocumentManager";
import ReviewsRatings from "@/components/ReviewsRatings";
import MessagingCenter from "@/components/messaging/MessagingCenter";
import PaymentButton from "@/components/PaymentButton"; // Import du PaymentButton
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client.browser";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

// Mapping des spécialités anglais -> français
const specialityMapping: Record<string, string> = {
  'orthopedics': 'Orthopédie',
  'cardiology': 'Cardiologie',
  'dermatology': 'Dermatologie',
  'pediatrics': 'Pédiatrie',
  'psychiatry': 'Psychiatrie',
  'radiology': 'Radiologie',
  'anesthesiology': 'Anesthésie-Réanimation',
  'general_surgery': 'Chirurgie générale',
  'gynecology': 'Gynécologie-Obstétrique',
  'ophthalmology': 'Ophtalmologie',
  'otolaryngology': 'ORL',
  'neurology': 'Neurologie',
  'pulmonology': 'Pneumologie',
  'gastroenterology': 'Gastro-entérologie',
  'endocrinology': 'Endocrinologie',
  'rheumatology': 'Rhumatologie',
  'urology': 'Urologie',
  'general_medicine': 'Médecine générale'
};

// Fonction pour traduire les spécialités
const translateSpeciality = (speciality: string): string => {
  return specialityMapping[speciality] || speciality.charAt(0).toUpperCase() + speciality.slice(1);
};

// Fonctions utilitaires pour formater les dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('fr-FR', options);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const calculateDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

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
  payment_status?: string;
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
  const logger = useLogger();
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

  // États pour le modal de vacation
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacation, setVacation] = useState<VacationDetails | null>(null);
  const [loadingVacation, setLoadingVacation] = useState(false);

  // États pour la messagerie - NOUVELLE FONCTIONNALITÉ
  const [contactDoctorInfo, setContactDoctorInfo] = useState<{
    doctorId: string;
    doctorName: string;
    bookingId?: string;
  } | null>(null);

  // Fonctions utilitaires pour le modal
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getActTypeDisplay = (actType: string) => {
    switch (actType) {
      case "consultation":
        return { icon: "🩺", label: "Consultation" };
      case "urgence":
        return { icon: "🚨", label: "Urgence" };
      case "visite":
        return { icon: "🏠", label: "Visite à domicile" };
      case "teleconsultation":
        return { icon: "💻", label: "Téléconsultation" };
      default:
        return { icon: "🩺", label: "Consultation" };
    }
  };

  // Fonctions utilitaires pour les badges de paiement
  const getPaymentStatusColor = (paymentStatus: string | undefined, bookingStatus: string) => {
    // Si la réservation n'est pas confirmée, pas de badge de paiement
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'paid' && bookingStatus !== 'completed') {
      return '';
    }
    
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getPaymentStatusText = (paymentStatus: string | undefined, bookingStatus: string) => {
    // Si la réservation n'est pas confirmée, pas de texte de paiement
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'paid' && bookingStatus !== 'completed') {
      return '';
    }
    
    switch (paymentStatus) {
      case 'paid': return '✅ Réglée';
      case 'failed': return '❌ Échec paiement';
      case 'pending':
      default: return '💳 En attente de règlement';
    }
  };

  const shouldShowPaymentBadge = (paymentStatus: string | undefined, bookingStatus: string) => {
    // Afficher le badge seulement pour les réservations confirmées, payées ou terminées
    return ['confirmed', 'paid', 'completed'].includes(bookingStatus);
  };

  // Fonction pour vérifier si le bouton de paiement doit être affiché
  const shouldShowPaymentButton = (status: string, paymentStatus: string | undefined, totalAmount: number) => {
    return status === 'confirmed' && 
           paymentStatus !== 'paid' && 
           totalAmount > 0;
  };

  // Fonction pour charger les détails de la vacation
  const fetchVacationDetails = async (bookingId: string) => {
    setLoadingVacation(true);
    try {
      logger.debug("Fetching vacation details for booking", { bookingId });
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          total_amount,
          start_date,
          end_date,
          payment_status,
          vacation_posts!inner (
            id,
            title,
            description,
            speciality,
            location,
            requirements,
            act_type,
            hourly_rate,
            doctor_profiles!inner (
              id,
              first_name,
              last_name,
              speciality,
              avatar_url,
              bio,
              experience_years,
              license_number,
              education,
              languages
            )
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) {
        logger.error("Supabase error when fetching vacation details", { error, bookingId });
        throw error;
      }
      
      logger.debug("Raw data from Supabase", { data, bookingId });
      
      // Vérifications de sécurité pour éviter les erreurs
      if (!data) {
        throw new Error("Aucune donnée retournée pour cette réservation");
      }
      
      if (!data.vacation_posts || data.vacation_posts.length === 0) {
        throw new Error("Aucune vacation associée à cette réservation");
      }
      
      // Supabase retourne des tableaux, nous prenons le premier élément
      const vacationPost = Array.isArray(data.vacation_posts) 
        ? data.vacation_posts[0] 
        : data.vacation_posts;
      
      if (!vacationPost) {
        throw new Error("Données de vacation invalides");
      }
      
      if (!vacationPost.doctor_profiles || vacationPost.doctor_profiles.length === 0) {
        throw new Error("Aucun profil médecin associé à cette vacation");
      }
      
      const doctorProfile = Array.isArray(vacationPost.doctor_profiles)
        ? vacationPost.doctor_profiles[0]
        : vacationPost.doctor_profiles;
      
      if (!doctorProfile) {
        throw new Error("Profil médecin invalide");
      }
      
      logger.debug("Processing vacation and doctor data", { 
        vacationPost: vacationPost.id, 
        doctorProfile: doctorProfile.id 
      });
      
      // Transformer les données pour correspondre à notre interface
      const transformedData: VacationDetails = {
        id: data.id,
        status: data.status,
        total_amount: data.total_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        payment_status: data.payment_status,
        vacation_posts: {
          id: vacationPost.id,
          title: vacationPost.title || "Vacation sans titre",
          description: vacationPost.description || "",
          speciality: vacationPost.speciality || "general_medicine",
          location: vacationPost.location || "Non spécifié",
          requirements: vacationPost.requirements || "",
          act_type: vacationPost.act_type || "consultation",
          hourly_rate: vacationPost.hourly_rate || 0,
          doctor_profiles: {
            id: doctorProfile.id,
            first_name: doctorProfile.first_name || "Prénom",
            last_name: doctorProfile.last_name || "Nom",
            speciality: doctorProfile.speciality || "general_medicine",
            avatar_url: doctorProfile.avatar_url || "",
            bio: doctorProfile.bio || "",
            experience_years: doctorProfile.experience_years || 0,
            license_number: doctorProfile.license_number || "",
            education: Array.isArray(doctorProfile.education) ? doctorProfile.education : [],
            languages: Array.isArray(doctorProfile.languages) ? doctorProfile.languages : []
          }
        }
      };
      
      logger.debug("Transformed vacation data", { transformedData: transformedData.id, bookingId });
      setVacation(transformedData);
      
    } catch (error) {
      logger.error("Error fetching vacation details", { error, bookingId });
      
      // Messages d'erreur plus spécifiques
      let errorMessage = "Impossible de charger les détails de la vacation";
      
      if (error instanceof Error) {
        if (error.message.includes("vacation")) {
          errorMessage = error.message;
        } else if (error.message.includes("doctor")) {
          errorMessage = "Impossible de charger les informations du médecin";
        } else if (error.message.includes("Row not found")) {
          errorMessage = "Cette réservation n'existe plus ou a été supprimée";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Fermer le modal en cas d'erreur critique
      handleCloseModal();
    } finally {
      setLoadingVacation(false);
    }
  };

  // Fonction pour recharger les données après un paiement réussi
  const handlePaymentSuccess = () => {
    // Recharger les données de la vacation dans le modal
    if (selectedBookingId) {
      fetchVacationDetails(selectedBookingId);
    }
    // Recharger les données du dashboard
    loadDashboardData();
    
    toast({
      title: "Paiement réussi",
      description: "Le paiement a été traité avec succès",
    });
  };

  // Gestionnaire pour ouvrir le modal
  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowVacationModal(true);
    fetchVacationDetails(bookingId);
  };

  // Gestionnaire pour fermer le modal
  const handleCloseModal = () => {
    setShowVacationModal(false);
    setSelectedBookingId(null);
    setVacation(null);
  };

  // NOUVELLE FONCTIONNALITÉ - Gestionnaire pour contacter un médecin
  const handleContactDoctor = (doctorId: string, doctorName: string, bookingId?: string) => {
    // Stocker les informations du médecin à contacter
    setContactDoctorInfo({
      doctorId,
      doctorName,
      bookingId
    });
    
    // Fermer le modal si ouvert
    if (showVacationModal) {
      handleCloseModal();
    }
    
    // Aller à l'onglet messages
    setActiveTab("messages");
    
    toast({
      title: "Messagerie ouverte",
      description: `Conversation avec Dr ${doctorName}`,
    });
  };

  // NOUVELLE FONCTIONNALITÉ - Nettoyer les infos de contact quand on change d'onglet
  const handleTabChange = (newTab: string) => {
    if (newTab !== "messages") {
      setContactDoctorInfo(null);
    }
    setActiveTab(newTab);
  };

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
      logger.error("Error loading dashboard data", { error, userId: user?.id });
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
      payment_status,
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
        doctor_speciality: translateSpeciality(booking.vacation_posts.doctor_profiles.speciality),
        doctor_avatar: booking.vacation_posts.doctor_profiles.avatar_url,
        vacation_title: booking.vacation_posts.title,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_amount: booking.total_amount,
        location: booking.vacation_posts.location,
        payment_status: booking.payment_status,
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
          speciality: translateSpeciality(doctor.speciality),
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

  const quickActions = [
    {
      title: "Rechercher des médecins",
      description: "Trouver des professionnels de santé",
      icon: Search,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      action: () => navigate("/establishment/search"),
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
      action: () => handleTabChange("doctors"),
    },
    {
      title: "Messages",
      description: "Communiquer avec les médecins",
      icon: MessageSquare,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      action: () => handleTabChange("messages"),
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
            <Button onClick={() => navigate("/auth?type=establishment")} className="mt-4">
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
                onClick={() => navigate("/establishment/search")}
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
          onValueChange={handleTabChange}
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
                            onClick={() => navigate("/establishment/search")}
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
                              onClick={() => handleBookingClick(booking.id)}
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
                                <div className="flex flex-col items-end space-y-1">
                                  <Badge
                                    className={getStatusColor(booking.status)}
                                  >
                                    {getStatusLabel(booking.status)}
                                  </Badge>
                                  {shouldShowPaymentBadge(booking.payment_status, booking.status) && (
                                    <Badge className={`${getPaymentStatusColor(booking.payment_status, booking.status)} border font-medium text-xs`}>
                                      {getPaymentStatusText(booking.payment_status, booking.status)}
                                    </Badge>
                                  )}
                                </div>
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
                      onClick={() => handleTabChange("doctors")}
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
                          onClick={() => navigate("/establishment/search")}
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
                    <Button onClick={() => navigate("/establishment/search")}>
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
                                  handleContactDoctor(doctor.id, `${doctor.first_name} ${doctor.last_name}`);
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
            <MessagingCenter 
              autoOpenDoctorId={contactDoctorInfo?.doctorId}
              autoOpenDoctorName={contactDoctorInfo?.doctorName}
              autoOpenBookingId={contactDoctorInfo?.bookingId}
            />
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

        {/* Modal de détails de vacation */}
        <Dialog open={showVacationModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                Détails de la vacation
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Informations complètes sur cette vacation médicale
              </DialogDescription>
            </DialogHeader>

            {loadingVacation ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-semibold text-lg">Chargement...</span>
                </div>
              </div>
            ) : vacation ? (
              <div className="py-6 space-y-8">
                {/* En-tête avec statut */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                        vacation.status === "completed" 
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                          : vacation.status === "confirmed"
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : vacation.status === "pending"
                          ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                          : "bg-gradient-to-br from-red-500 to-rose-500"
                      } text-white shadow-lg`}>
                        {vacation.status === "completed" ? "✅" : 
                         vacation.status === "confirmed" ? "🟢" :
                         vacation.status === "pending" ? "🟡" : "❌"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {vacation.vacation_posts.title}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge className={`${getStatusColor(vacation.status)} border`}>
                            {getStatusIcon(vacation.status)}
                            <span className="ml-2">{getStatusLabel(vacation.status)}</span>
                          </Badge>
                          
                          {/* Badge de statut de paiement */}
                          {shouldShowPaymentBadge(vacation.payment_status, vacation.status) && (
                            <Badge className={`${getPaymentStatusColor(vacation.payment_status, vacation.status)} border font-medium`}>
                              {getPaymentStatusText(vacation.payment_status, vacation.status)}
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {formatDate(vacation.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {formatTime(vacation.start_date)} - {formatTime(vacation.end_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {vacation.total_amount}€
                      </div>
                      <div className="text-sm text-gray-600">Montant total</div>
                    </div>
                  </div>
                </div>

                {/* Informations du médecin */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Médecin en charge
                  </h4>
                  
                  <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                      <AvatarImage src={vacation.vacation_posts.doctor_profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl">
                        {vacation.vacation_posts.doctor_profiles.first_name[0]}
                        {vacation.vacation_posts.doctor_profiles.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h5 className="text-xl font-bold text-gray-900">
                          Dr {vacation.vacation_posts.doctor_profiles.first_name} {vacation.vacation_posts.doctor_profiles.last_name}
                        </h5>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {translateSpeciality(vacation.vacation_posts.doctor_profiles.speciality)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {vacation.vacation_posts.doctor_profiles.experience_years && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{vacation.vacation_posts.doctor_profiles.experience_years} ans d'expérience</span>
                          </div>
                        )}
                        
                        {vacation.vacation_posts.doctor_profiles.license_number && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>N° licence: {vacation.vacation_posts.doctor_profiles.license_number}</span>
                          </div>
                        )}
                        
                        {vacation.vacation_posts.doctor_profiles.languages && vacation.vacation_posts.doctor_profiles.languages.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            <span>Langues: {vacation.vacation_posts.doctor_profiles.languages.join(', ')}</span>
                          </div>
                        )}
                        
                        {vacation.vacation_posts.doctor_profiles.education && vacation.vacation_posts.doctor_profiles.education.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Star className="w-4 h-4 text-purple-500" />
                            <span>Formation: {vacation.vacation_posts.doctor_profiles.education[0]}</span>
                          </div>
                        )}
                      </div>
                      
                      {vacation.vacation_posts.doctor_profiles.bio && (
                        <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {vacation.vacation_posts.doctor_profiles.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails de la vacation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations médicales */}
                  <div className="space-y-4">
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Stethoscope className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">Spécialité</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {translateSpeciality(vacation.vacation_posts.speciality)}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold text-gray-700">Type d'acte</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {getActTypeDisplay(vacation.vacation_posts.act_type).icon} {getActTypeDisplay(vacation.vacation_posts.act_type).label}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-gray-700">Localisation</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        📍 {vacation.vacation_posts.location}
                      </p>
                    </div>
                  </div>
                  
                  {/* Informations financières et pratiques */}
                  <div className="space-y-4">
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Euro className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-gray-700">Tarif horaire</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">
                        {vacation.vacation_posts.hourly_rate}€/h
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">Durée</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {calculateDuration(vacation.start_date, vacation.end_date)}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold text-gray-700">Référence</span>
                      </div>
                      <p className="text-gray-800 font-medium font-mono">
                        #{vacation.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description et exigences */}
                {(vacation.vacation_posts.description || vacation.vacation_posts.requirements) && (
                  <div className="space-y-4">
                    {vacation.vacation_posts.description && (
                      <div className="bg-white/80 rounded-xl p-6 border border-white/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          <span className="font-semibold text-gray-700 text-lg">Description</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {vacation.vacation_posts.description}
                        </p>
                      </div>
                    )}

                    {vacation.vacation_posts.requirements && (
                      <div className="bg-white/80 rounded-xl p-6 border border-white/50">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-5 h-5 text-rose-500" />
                          <span className="font-semibold text-gray-700 text-lg">Exigences et prérequis</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {vacation.vacation_posts.requirements}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fermer
                  </Button>
                  
                  {vacation.status === "confirmed" && (
                    <div className="flex gap-3">
                      {/* Bouton Contacter le médecin - STYLE MODIFIÉ POUR ÊTRE BLANC */}
                      <Button 
                        variant="outline"
                        className="px-6 py-3 border-purple-200 hover:bg-purple-50 transition-all duration-300"
                        onClick={() => {
                          handleContactDoctor(
                            vacation.vacation_posts.doctor_profiles.id,
                            `${vacation.vacation_posts.doctor_profiles.first_name} ${vacation.vacation_posts.doctor_profiles.last_name}`,
                            vacation.id
                          );
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contacter le médecin
                      </Button>
                      
                      {/* Bouton de paiement - NOUVEAU */}
                      {shouldShowPaymentButton(vacation.status, vacation.payment_status, vacation.total_amount) && (
                        <PaymentButton
                          bookingId={vacation.id}
                          amount={vacation.total_amount}
                          onSuccess={handlePaymentSuccess}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-green-200 transition-all duration-300"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer {vacation.total_amount}€
                        </PaymentButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Vacation non trouvée</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EstablishmentDashboard;