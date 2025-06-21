import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Filter,
  X,
  Loader2,
  Stethoscope,
  User,
  Phone,
  Mail,
  Eye,
  AlertCircle,
  CheckCircle2,
  Send,
  TrendingUp,
  Award,
  Zap,
  Euro,
  Activity,
  Sparkles,
  FileText,
  Building2
} from "lucide-react";
import Header from '@/components/Header';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface VacationWithDoctor {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  act_type: string;
  status: string;
  requirements: string[];
  doctor_id: string;
  created_at: string;
  doctor_profiles: {
    first_name: string;
    last_name: string;
    speciality: string;
    avatar_url?: string;
    experience_years?: number;
    bio?: string;
    license_number?: string;
    education?: string[];
    languages?: string[];
  };
  reviews_aggregate?: {
    avg_rating: number;
    count: number;
  };
}

interface SearchFilters {
  location: string;
  speciality: string;
  act_type: string;
  min_rate: string;
  max_rate: string;
  start_date: string;
  end_date: string;
}

interface BookingRequest {
  vacation_id: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  contact_phone: string;
  preferred_start_time: string;
  duration_hours: number;
}

interface VacationDetails {
  id: string;
  title: string;
  description: string;
  speciality: string;
  location: string;
  requirements: string;
  act_type: string;
  hourly_rate: number;
  start_date: string;
  end_date: string;
  status: string;
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
}

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

const translateSpeciality = (speciality: string): string => {
  return specialityMapping[speciality] || speciality.charAt(0).toUpperCase() + speciality.slice(1);
};

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

const EstablishmentSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [vacations, setVacations] = useState<VacationWithDoctor[]>([]);
  const [filteredVacations, setFilteredVacations] = useState<VacationWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de réservation
  const [selectedVacation, setSelectedVacation] = useState<VacationWithDoctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingRequest, setBookingRequest] = useState<BookingRequest>({
    vacation_id: '',
    message: '',
    urgency: 'medium',
    contact_phone: '',
    preferred_start_time: '',
    duration_hours: 1
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Modal de détails de vacation
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationDetails, setVacationDetails] = useState<VacationDetails | null>(null);
  const [loadingVacationDetails, setLoadingVacationDetails] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    speciality: '',
    act_type: '',
    min_rate: '',
    max_rate: '',
    start_date: '',
    end_date: ''
  });

  const actTypes = [
    'consultation',
    'urgences',
    'garde',
    'chirurgie',
    'radiologie',
    'anesthésie',
    'cardiologie',
    'pédiatrie',
    'obstétrique',
    'autre'
  ];

  const specialities = [
    'Médecine générale',
    'Cardiologie',
    'Dermatologie',
    'Pédiatrie',
    'Psychiatrie',
    'Radiologie',
    'Anesthésie-Réanimation',
    'Chirurgie générale',
    'Gynécologie-Obstétrique',
    'Orthopédie',
    'Ophtalmologie',
    'ORL',
    'Neurologie',
    'Pneumologie',
    'Gastro-entérologie',
    'Endocrinologie',
    'Rhumatologie',
    'Urologie',
    'Autre'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "confirmed":
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
        return { icon: "🩺", label: actType.charAt(0).toUpperCase() + actType.slice(1) };
    }
  };

  const fetchVacationDetails = async (vacationId: string) => {
    setLoadingVacationDetails(true);
    try {
      const { data, error } = await supabase
        .from("vacation_posts")
        .select(`
          id,
          title,
          description,
          speciality,
          location,
          requirements,
          act_type,
          hourly_rate,
          start_date,
          end_date,
          status,
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
        `)
        .eq("id", vacationId)
        .single();

      if (error) throw error;
      // Mapping explicite pour correspondre à VacationDetails
      const mapped: VacationDetails = {
        id: data.id,
        title: data.title,
        description: data.description,
        speciality: data.speciality,
        location: data.location,
        requirements: data.requirements,
        act_type: data.act_type,
        hourly_rate: data.hourly_rate,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        doctor_profiles: Array.isArray(data.doctor_profiles) ? data.doctor_profiles[0] : data.doctor_profiles,
      };
      setVacationDetails(mapped);
    } catch (error) {
      console.error("Error fetching vacation details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la vacation",
        variant: "destructive",
      });
    } finally {
      setLoadingVacationDetails(false);
    }
  };

  const handleVacationDetailsClick = (vacationId: string) => {
    setShowVacationModal(true);
    fetchVacationDetails(vacationId);
  };

  const handleCloseVacationModal = () => {
    setShowVacationModal(false);
    setVacationDetails(null);
  };

  useEffect(() => {
    loadVacations();
  }, []);

  useEffect(() => {
    if (vacations.length > 0) {
      filterVacations();
    }
  }, [vacations, searchTerm, filters]);

  const loadVacations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles!inner(
            first_name,
            last_name,
            speciality,
            avatar_url,
            experience_years,
            bio,
            license_number
          )
        `)
        .eq('status', 'available')
        .gte('start_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vacationsWithRatings = await Promise.all(
        (data || []).map(async (vacation) => {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('doctor_id', vacation.doctor_id)
            .eq('status', 'approved');

          let reviews_aggregate = {
            avg_rating: 0,
            count: 0
          };

          if (!reviewsError && reviewsData && reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
            reviews_aggregate = {
              avg_rating: totalRating / reviewsData.length,
              count: reviewsData.length
            };
          }

          return {
            ...vacation,
            reviews_aggregate
          };
        })
      );

      setVacations(vacationsWithRatings);
    } catch (error) {
      console.error('Error loading vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVacations = () => {
    try {
      let filtered = [...vacations];

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        filtered = filtered.filter(vacation =>
          vacation.title?.toLowerCase().includes(query) ||
          vacation.description?.toLowerCase().includes(query) ||
          vacation.location?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.first_name?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.last_name?.toLowerCase().includes(query) ||
          translateSpeciality(vacation.doctor_profiles?.speciality || '').toLowerCase().includes(query)
        );
      }

      if (filters.location) {
        filtered = filtered.filter(vacation =>
          vacation.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.speciality) {
        filtered = filtered.filter(vacation => {
          const doctorSpeciality = translateSpeciality(vacation.doctor_profiles?.speciality || '');
          return doctorSpeciality === filters.speciality;
        });
      }

      if (filters.act_type) {
        filtered = filtered.filter(vacation =>
          vacation.act_type === filters.act_type
        );
      }

      if (filters.min_rate) {
        const minRate = parseFloat(filters.min_rate);
        if (!isNaN(minRate)) {
          filtered = filtered.filter(vacation =>
            vacation.hourly_rate >= minRate
          );
        }
      }

      if (filters.max_rate) {
        const maxRate = parseFloat(filters.max_rate);
        if (!isNaN(maxRate)) {
          filtered = filtered.filter(vacation =>
            vacation.hourly_rate <= maxRate
          );
        }
      }

      if (filters.start_date) {
        filtered = filtered.filter(vacation =>
          vacation.start_date >= filters.start_date
        );
      }

      if (filters.end_date) {
        filtered = filtered.filter(vacation =>
          vacation.end_date <= filters.end_date
        );
      }

      setFilteredVacations(filtered);
    } catch (error) {
      console.error('Error filtering vacations:', error);
      setFilteredVacations(vacations);
    }
  };

  const resetFilters = () => {
    setFilters({
      location: '',
      speciality: '',
      act_type: '',
      min_rate: '',
      max_rate: '',
      start_date: '',
      end_date: ''
    });
    setSearchTerm('');
  };

  const handleBookingRequest = (vacation: VacationWithDoctor) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour faire une demande de réservation",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const userType = user.user_type || user.profile?.user_type;
    
    if (userType !== 'establishment') {
      toast({
        title: "Accès restreint",
        description: "Cette fonctionnalité est réservée aux établissements",
        variant: "destructive",
      });
      return;
    }

    setSelectedVacation(vacation);
    setBookingRequest(prev => ({
      ...prev,
      vacation_id: vacation.id,
      preferred_start_time: vacation.start_date.split('T')[0] + 'T08:00'
    }));
    setBookingModalOpen(true);
  };

  const submitBookingRequest = async () => {
    if (!selectedVacation || !user) return;

    try {
      setSubmittingBooking(true);

      const { data: existingBooking } = await supabase
        .from('vacation_bookings')
        .select('id')
        .eq('vacation_post_id', selectedVacation.id)
        .eq('establishment_id', user.id)
        .single();

      if (existingBooking) {
        toast({
          title: "Demande déjà envoyée",
          description: "Vous avez déjà fait une demande pour cette vacation",
          variant: "destructive",
        });
        return;
      }

      const estimatedAmount = selectedVacation.hourly_rate * bookingRequest.duration_hours;

      const { error } = await supabase
        .from('vacation_bookings')
        .insert([
          {
            vacation_post_id: selectedVacation.id,
            establishment_id: user.id,
            doctor_id: selectedVacation.doctor_id,
            status: 'pending',
            message: bookingRequest.message,
            total_amount: estimatedAmount
          }
        ]);

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Votre demande de réservation a été envoyée au médecin",
      });

      setBookingModalOpen(false);
      setSelectedVacation(null);
      setBookingRequest({
        vacation_id: '',
        message: '',
        urgency: 'medium',
        contact_phone: '',
        preferred_start_time: '',
        duration_hours: 1
      });

    } catch (error) {
      console.error('Error submitting booking request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de réservation",
        variant: "destructive",
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTimeShort = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-xl font-medium text-gray-900">Chargement des médecins...</div>
            <div className="text-sm text-gray-500 mt-2">Recherche en cours</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trouvez des médecins experts
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez et réservez les meilleurs professionnels de santé pour votre établissement
          </p>
        </div>

        {/* Barre de recherche */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher par spécialité, médecin ou ville..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 h-14 px-6 border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <Filter className="h-5 w-5" />
                  Filtres avancés
                </Button>
                <Button 
                  onClick={resetFilters} 
                  variant="outline"
                  size="lg"
                  className="h-14 px-6 border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  <X className="h-5 w-5 mr-2" />
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres avancés */}
        {showFilters && (
          <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <CardTitle className="flex items-center justify-between text-gray-900">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Filtres de recherche
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    📍 Localisation
                  </Label>
                  <Input
                    placeholder="Paris, Lyon, Marseille..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    🩺 Spécialité
                  </Label>
                  <Select 
                    value={filters.speciality || undefined} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, speciality: value || '' }))}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Toutes les spécialités" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialities.map(speciality => (
                        <SelectItem key={speciality} value={speciality}>
                          {speciality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    ⚕️ Type d'acte
                  </Label>
                  <Select 
                    value={filters.act_type || undefined} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, act_type: value || '' }))}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      {actTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    💰 Tarif minimum (€/h)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.min_rate}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    💰 Tarif maximum (€/h)
                  </Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={filters.max_rate}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_rate: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    📅 À partir du
                  </Label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Médecins disponibles
            </h2>
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800">
              {filteredVacations.length} résultat{filteredVacations.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          {filteredVacations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              Triés par pertinence
            </div>
          )}
        </div>

        {/* Liste des vacations */}
        {filteredVacations.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Aucun médecin trouvé
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Essayez de modifier vos critères de recherche ou d'élargir votre zone géographique
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredVacations.map((vacation) => (
              <Card key={vacation.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors">
                        {vacation.title}
                      </CardTitle>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{vacation.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span>{formatDateShort(vacation.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>{formatTimeShort(vacation.start_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {parseFloat(vacation.hourly_rate.toString()).toFixed(0)}€
                      </div>
                      <div className="text-sm text-gray-500 font-medium">/heure</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">{vacation.description}</p>

                  {/* Profil médecin */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <Avatar className="h-14 w-14 ring-3 ring-white shadow-md">
                      <AvatarImage src={vacation.doctor_profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                        {vacation.doctor_profiles.first_name?.[0]}
                        {vacation.doctor_profiles.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        Dr {vacation.doctor_profiles.first_name} {vacation.doctor_profiles.last_name}
                      </div>
                      <div className="text-blue-700 font-medium">
                        {translateSpeciality(vacation.doctor_profiles.speciality)}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {vacation.doctor_profiles.experience_years && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {vacation.doctor_profiles.experience_years} ans d'expérience
                          </span>
                        )}
                        {vacation.doctor_profiles.license_number && (
                          <span className="text-xs text-gray-500">
                            RPPS: {vacation.doctor_profiles.license_number}
                          </span>
                        )}
                      </div>
                    </div>
                    {vacation.reviews_aggregate?.count > 0 ? (
                      <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-900">
                          {vacation.reviews_aggregate.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({vacation.reviews_aggregate.count} avis)
                        </span>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg px-3 py-2 shadow-sm">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star className="h-3 w-3 text-gray-400" />
                          Nouveau médecin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 capitalize">
                      {vacation.act_type}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 px-3 py-1">
                      {translateSpeciality(vacation.doctor_profiles.speciality)}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={() => handleBookingRequest(vacation)}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-lg h-12"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Faire une demande
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg"
                      onClick={() => handleVacationDetailsClick(vacation.id)}
                      className="rounded-lg border-gray-200 hover:bg-gray-50 h-12 px-6"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de demande de réservation */}
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Demande de réservation
              </DialogTitle>
            </DialogHeader>
            
            {selectedVacation && (
              <div className="space-y-6">
                {/* Résumé de la vacation */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow">
                      <AvatarImage src={selectedVacation.doctor_profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {selectedVacation.doctor_profiles.first_name?.[0]}
                        {selectedVacation.doctor_profiles.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{selectedVacation.title}</h4>
                      <p className="text-blue-700 font-medium">
                        Dr {selectedVacation.doctor_profiles.first_name} {selectedVacation.doctor_profiles.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {translateSpeciality(selectedVacation.doctor_profiles.speciality)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {selectedVacation.location}
                    </span>
                    <span className="font-bold text-green-600 text-lg">
                      {parseFloat(selectedVacation.hourly_rate.toString()).toFixed(0)}€/h
                    </span>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      Niveau d'urgence
                    </Label>
                    <Select 
                      value={bookingRequest.urgency} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setBookingRequest(prev => ({ ...prev, urgency: value }))}
                    >
                      <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible priorité</SelectItem>
                        <SelectItem value="medium">Priorité normale</SelectItem>
                        <SelectItem value="high">Priorité élevée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Date et heure souhaitées
                    </Label>
                    <Input
                      type="datetime-local"
                      value={bookingRequest.preferred_start_time}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, preferred_start_time: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      Durée estimée (heures)
                    </Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={bookingRequest.duration_hours}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) || 1 }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-500" />
                      Téléphone de contact
                    </Label>
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={bookingRequest.contact_phone}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      Message (facultatif)
                    </Label>
                    <Textarea
                      placeholder="Décrivez vos besoins spécifiques, le contexte de l'intervention..."
                      rows={3}
                      value={bookingRequest.message}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, message: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Estimation du coût */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Estimation du coût</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">
                          {(parseFloat(selectedVacation.hourly_rate.toString()) * bookingRequest.duration_hours).toFixed(2)}€
                        </div>
                        <div className="text-xs text-green-600">
                          {parseFloat(selectedVacation.hourly_rate.toString()).toFixed(0)}€/h × {bookingRequest.duration_hours}h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-3 pt-6">
              <Button 
                variant="outline" 
                onClick={() => setBookingModalOpen(false)}
                className="flex-1 rounded-lg h-12"
              >
                Annuler
              </Button>
              <Button 
                onClick={submitBookingRequest} 
                disabled={submittingBooking || !bookingRequest.contact_phone || !bookingRequest.preferred_start_time}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg h-12"
              >
                {submittingBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 h-4 mr-2" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de détails de vacation */}
        <Dialog open={showVacationModal} onOpenChange={handleCloseVacationModal}>
          <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                Détails de la vacation
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Informations complètes sur cette vacation médicale
              </DialogDescription>
            </DialogHeader>

            {loadingVacationDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-semibold text-lg">Chargement...</span>
                </div>
              </div>
            ) : vacationDetails ? (
              <div className="py-6 space-y-8">
                {/* En-tête */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                        ✅
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {vacationDetails.title}
                        </h3>
                        <div className="flex items-center gap-4">
                          <Badge className={`${getStatusColor(vacationDetails.status)} border`}>
                            {getStatusIcon(vacationDetails.status)}
                            <span className="ml-2">{getStatusLabel(vacationDetails.status)}</span>
                          </Badge>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {formatDate(vacationDetails.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {formatTime(vacationDetails.start_date)} - {formatTime(vacationDetails.end_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {vacationDetails.hourly_rate}€
                      </div>
                      <div className="text-sm text-gray-600">Par heure</div>
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
                      <AvatarImage src={vacationDetails.doctor_profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl">
                        {vacationDetails.doctor_profiles.first_name[0]}
                        {vacationDetails.doctor_profiles.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h5 className="text-xl font-bold text-gray-900">
                          Dr {vacationDetails.doctor_profiles.first_name} {vacationDetails.doctor_profiles.last_name}
                        </h5>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {translateSpeciality(vacationDetails.doctor_profiles.speciality)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {vacationDetails.doctor_profiles.experience_years && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{vacationDetails.doctor_profiles.experience_years} ans d'expérience</span>
                          </div>
                        )}
                        
                        {vacationDetails.doctor_profiles.license_number && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>N° licence: {vacationDetails.doctor_profiles.license_number}</span>
                          </div>
                        )}
                        
                        {vacationDetails.doctor_profiles.languages && vacationDetails.doctor_profiles.languages.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-green-500" />
                            <span>Langues: {vacationDetails.doctor_profiles.languages.join(', ')}</span>
                          </div>
                        )}
                        
                        {vacationDetails.doctor_profiles.education && vacationDetails.doctor_profiles.education.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Star className="w-4 h-4 text-purple-500" />
                            <span>Formation: {vacationDetails.doctor_profiles.education[0]}</span>
                          </div>
                        )}
                      </div>
                      
                      {vacationDetails.doctor_profiles.bio && (
                        <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {vacationDetails.doctor_profiles.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails de la vacation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Stethoscope className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">Spécialité</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {translateSpeciality(vacationDetails.speciality)}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold text-gray-700">Type d'acte</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {getActTypeDisplay(vacationDetails.act_type).icon} {getActTypeDisplay(vacationDetails.act_type).label}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-gray-700">Localisation</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        📍 {vacationDetails.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Euro className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-gray-700">Tarif horaire</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">
                        {vacationDetails.hourly_rate}€/h
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">Durée</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {calculateDuration(vacationDetails.start_date, vacationDetails.end_date)}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold text-gray-700">Référence</span>
                      </div>
                      <p className="text-gray-800 font-medium font-mono">
                        #{vacationDetails.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description et exigences */}
                {(vacationDetails.description || vacationDetails.requirements) && (
                  <div className="space-y-4">
                    {vacationDetails.description && (
                      <div className="bg-white/80 rounded-xl p-6 border border-white/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          <span className="font-semibold text-gray-700 text-lg">Description</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {vacationDetails.description}
                        </p>
                      </div>
                    )}

                    {vacationDetails.requirements && (
                      <div className="bg-white/80 rounded-xl p-6 border border-white/50">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-5 h-5 text-rose-500" />
                          <span className="font-semibold text-gray-700 text-lg">Exigences et prérequis</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {vacationDetails.requirements}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCloseVacationModal}
                    className="px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fermer
                  </Button>
                  
                  {vacationDetails.status === "available" && (
                    <Button 
                      onClick={() => {
                        handleCloseVacationModal();
                        const vacation = filteredVacations.find(v => v.id === vacationDetails.id);
                        if (vacation) {
                          handleBookingRequest(vacation);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-blue-200 transition-all duration-300"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Faire une demande
                    </Button>
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

export default EstablishmentSearch;