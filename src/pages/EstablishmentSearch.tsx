import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Building,
  Send,
  TrendingUp,
  Award,
  Target,
  Zap
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

const EstablishmentSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [vacations, setVacations] = useState<VacationWithDoctor[]>([]);
  const [filteredVacations, setFilteredVacations] = useState<VacationWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
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
    'Consultation',
    'Urgences',
    'Garde',
    'Chirurgie',
    'Radiologie',
    'Anesthésie',
    'Cardiologie',
    'Pédiatrie',
    'Obstétrique',
    'Autre'
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

      // Simuler les notes (en attendant la vraie table reviews)
      const vacationsWithRatings = data?.map(vacation => ({
        ...vacation,
        reviews_aggregate: {
          avg_rating: Math.random() * 2 + 3,
          count: Math.floor(Math.random() * 50) + 1
        }
      })) || [];

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

      // Recherche textuelle
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        filtered = filtered.filter(vacation =>
          vacation.title?.toLowerCase().includes(query) ||
          vacation.description?.toLowerCase().includes(query) ||
          vacation.location?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.first_name?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.last_name?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.speciality?.toLowerCase().includes(query)
        );
      }

      // Filtres
      if (filters.location) {
        filtered = filtered.filter(vacation =>
          vacation.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.speciality) {
        filtered = filtered.filter(vacation =>
          vacation.doctor_profiles?.speciality === filters.speciality
        );
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

    // Vérifier le type d'utilisateur - soit depuis user.user_type soit depuis user.profile.user_type
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

      // Vérifier si une demande existe déjà
      const { data: existingBooking } = await supabase
        .from('bookings')
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

      // Calculer le montant estimé
      const estimatedAmount = selectedVacation.hourly_rate * bookingRequest.duration_hours;

      // Créer la demande de réservation
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            vacation_post_id: selectedVacation.id,
            establishment_id: user.id,
            doctor_id: selectedVacation.doctor_id,
            status: 'pending',
            booking_date: new Date().toISOString(),
            start_date: bookingRequest.preferred_start_time,
            end_date: new Date(new Date(bookingRequest.preferred_start_time).getTime() + bookingRequest.duration_hours * 60 * 60 * 1000).toISOString(),
            total_amount: estimatedAmount,
            message: bookingRequest.message,
            urgency: bookingRequest.urgency,
            contact_phone: bookingRequest.contact_phone,
            duration_hours: bookingRequest.duration_hours
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Urgent';
      case 'medium': return 'Normal';
      case 'low': return 'Faible';
      default: return 'Normal';
    }
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
        {/* En-tête avec gradient */}
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

        {/* Barre de recherche principale avec style moderne */}
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

        {/* Filtres avancés avec style amélioré */}
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
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                    📍 Localisation
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Paris, Lyon, Marseille..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                    {filters.location && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, location: '' }))}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speciality" className="text-sm font-medium text-gray-700">
                    🩺 Spécialité
                  </Label>
                  <div className="flex gap-2">
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
                    {filters.speciality && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, speciality: '' }))}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="act_type" className="text-sm font-medium text-gray-700">
                    ⚕️ Type d'acte
                  </Label>
                  <div className="flex gap-2">
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
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.act_type && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, act_type: '' }))}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_rate" className="text-sm font-medium text-gray-700">
                    💰 Tarif minimum (€/h)
                  </Label>
                  <Input
                    id="min_rate"
                    type="number"
                    placeholder="0"
                    value={filters.min_rate}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_rate" className="text-sm font-medium text-gray-700">
                    💰 Tarif maximum (€/h)
                  </Label>
                  <Input
                    id="max_rate"
                    type="number"
                    placeholder="1000"
                    value={filters.max_rate}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_rate: e.target.value }))}
                    className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                    📅 À partir du
                  </Label>
                  <Input
                    id="start_date"
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

        {/* Section résultats avec compteur stylé */}
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

        {/* Liste des vacations avec design amélioré */}
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
              <Button 
                onClick={resetFilters} 
                variant="outline"
                size="lg"
                className="rounded-lg"
              >
                <X className="w-4 h-4 mr-2" />
                Effacer tous les filtres
              </Button>
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
                          <span>{formatDate(vacation.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>{formatTime(vacation.start_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {vacation.hourly_rate}€
                      </div>
                      <div className="text-sm text-gray-500 font-medium">/heure</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Description */}
                  <p className="text-gray-700 leading-relaxed">{vacation.description}</p>

                  {/* Profil médecin avec avatar */}
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
                        {vacation.doctor_profiles.speciality}
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
                    <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">
                        {vacation.reviews_aggregate?.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({vacation.reviews_aggregate?.count})
                      </span>
                    </div>
                  </div>

                  {/* Badges avec couleurs */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                      {vacation.act_type}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 px-3 py-1">
                      {vacation.doctor_profiles.speciality}
                    </Badge>
                  </div>

                  {/* Actions avec style moderne */}
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
                      onClick={() => navigate(`/vacation/${vacation.id}`)}
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

        {/* Modal de demande avec style amélioré */}
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Demande de réservation
              </DialogTitle>
            </DialogHeader>
            
            {selectedVacation && (
              <div className="space-y-6">
                {/* Résumé de la vacation avec style */}
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
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {selectedVacation.location}
                    </span>
                    <span className="font-bold text-green-600 text-lg">
                      {selectedVacation.hourly_rate}€/h
                    </span>
                  </div>
                </div>

                {/* Formulaire de demande avec style moderne */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
                        <SelectItem value="low">
                          Faible priorité
                        </SelectItem>
                        <SelectItem value="medium">
                          Priorité normale
                        </SelectItem>
                        <SelectItem value="high">
                          Priorité élevée
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_start_time" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Date et heure souhaitées
                    </Label>
                    <Input
                      id="preferred_start_time"
                      type="datetime-local"
                      value={bookingRequest.preferred_start_time}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, preferred_start_time: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_hours" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      Durée estimée (heures)
                    </Label>
                    <Input
                      id="duration_hours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={bookingRequest.duration_hours}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) || 1 }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-500" />
                      Téléphone de contact
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={bookingRequest.contact_phone}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      Message (facultatif)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez vos besoins spécifiques, le contexte de l'intervention..."
                      rows={3}
                      value={bookingRequest.message}
                      onChange={(e) => setBookingRequest(prev => ({ ...prev, message: e.target.value }))}
                      className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Estimation du coût avec design amélioré */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Estimation du coût</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">
                          {(selectedVacation.hourly_rate * bookingRequest.duration_hours).toFixed(2)}€
                        </div>
                        <div className="text-xs text-green-600">
                          {selectedVacation.hourly_rate}€/h × {bookingRequest.duration_hours}h
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
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EstablishmentSearch;