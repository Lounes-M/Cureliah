import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { SmartSearchInput } from '@/components/establishment/SmartSearchInput';
import { DetailedDoctorCard } from '@/components/establishment/DetailedDoctorCard';
import { GuidedBookingModal } from '@/components/establishment/GuidedBookingModal';
import { LazyLoadContainer, useLazyLoading, SkeletonGrid } from '@/components/ui/LazyLoadContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSpecialityInfo, SPECIALITIES as SPECIALITIES_DATA} from '@/utils/specialities';
import {
  Filter,
  SlidersHorizontal,
  MapPin,
  Stethoscope,
  Euro,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  Users,
  Star,
  Search,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';

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
  requirements: string;
  doctor_id: string;
  created_at: string;
  doctor_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    speciality: string;
    avatar_url?: string;
    experience_years?: number;
    bio?: string;
    license_number?: string;
    education?: string[];
    languages?: string[];
    average_rating?: number;
    total_reviews?: number;
    total_bookings?: number;
    is_verified?: boolean;
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
  sort_by: 'newest' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

// Créer un tableau des spécialités françaises basé sur les données centralisées
const SPECIALITIES = Object.values(SPECIALITIES_DATA).map(spec => spec.label);

const ACT_TYPES = [
  { value: 'consultation', label: '🩺 Consultation' },
  { value: 'surgery', label: '⚕️ Chirurgie' },
  { value: 'emergency', label: '🚨 Urgence' },
  { value: 'home_visit', label: '🏠 Visite à domicile' },
  { value: 'teleconsultation', label: '💻 Téléconsultation' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récentes' },
  { value: 'price_low', label: 'Prix croissant' },
  { value: 'price_high', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'distance', label: 'Plus proches' }
];

export default function EnhancedEstablishmentSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    speciality: 'all',
    act_type: 'all',
    min_rate: '',
    max_rate: '',
    start_date: '',
    end_date: '',
    sort_by: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // États pour les modals
  const [selectedVacation, setSelectedVacation] = useState<VacationWithDoctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Cache pour améliorer les performances
  const [searchCache, setSearchCache] = useState<Map<string, VacationWithDoctor[]>>(new Map());

  // Fonction de récupération des données avec pagination
  const fetchVacations = async (page: number, pageSize: number) => {
    const cacheKey = `${searchTerm}-${JSON.stringify(filters)}-${page}-${pageSize}`;
    
    // Vérifier le cache d'abord
    if (searchCache.has(cacheKey)) {
      const cachedData = searchCache.get(cacheKey)!;
      return {
        data: cachedData,
        hasMore: cachedData.length === pageSize
      };
    }

    try {
      let query = supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles!inner(
            id,
            first_name,
            last_name,
            speciality,
            avatar_url,
            experience_years,
            bio,
            license_number,
            education,
            languages,
            is_verified
          )
        `)
        .eq('status', 'available')
        .gte('start_date', new Date().toISOString());

      // Appliquer les filtres
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.speciality && filters.speciality !== 'all') {
        query = query.eq('doctor_profiles.speciality', getSpecialityKey(filters.speciality));
      }
      
      if (filters.act_type && filters.act_type !== 'all') {
        query = query.eq('act_type', filters.act_type);
      }
      
      if (filters.min_rate) {
        query = query.gte('hourly_rate', parseFloat(filters.min_rate));
      }
      
      if (filters.max_rate) {
        query = query.lte('hourly_rate', parseFloat(filters.max_rate));
      }
      
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      // Appliquer le tri
      switch (filters.sort_by) {
        case 'price_low':
          query = query.order('hourly_rate', { ascending: true });
          break;
        case 'price_high':
          query = query.order('hourly_rate', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      
      if (error) throw error;

      // Enrichir avec les données de reviews
      const enrichedData = await Promise.all(
        (data || []).map(async (vacation) => {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('doctor_id', vacation.doctor_id)
            .eq('status', 'approved');

          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('id')
            .eq('doctor_id', vacation.doctor_id)
            .eq('status', 'completed');

          let average_rating = 0;
          let total_reviews = 0;
          
          if (reviewsData && reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
            average_rating = totalRating / reviewsData.length;
            total_reviews = reviewsData.length;
          }

          return {
            ...vacation,
            doctor_profiles: {
              ...vacation.doctor_profiles,
              average_rating,
              total_reviews,
              total_bookings: bookingsData?.length || 0
            }
          } as VacationWithDoctor;
        })
      );

      // Filtrer par terme de recherche si nécessaire
      let filteredData = enrichedData;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        filteredData = enrichedData.filter(vacation =>
          vacation.title?.toLowerCase().includes(query) ||
          vacation.description?.toLowerCase().includes(query) ||
          vacation.location?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.first_name?.toLowerCase().includes(query) ||
          vacation.doctor_profiles?.last_name?.toLowerCase().includes(query) ||
          getSpecialityInfo(vacation.doctor_profiles?.speciality || '').label.toLowerCase().includes(query)
        );
      }

      // Tri pour rating (nécessite les données enrichies)
      if (filters.sort_by === 'rating') {
        filteredData.sort((a, b) => (b.doctor_profiles.average_rating || 0) - (a.doctor_profiles.average_rating || 0));
      }

      // Mettre en cache
      setSearchCache(prev => new Map(prev.set(cacheKey, filteredData)));

      return {
        data: filteredData,
        hasMore: filteredData.length === pageSize
      };
    } catch (error) {
      // TODO: Replace with logger.error('Error fetching vacations:', error);
      throw error;
    }
  };

  // Hook pour le lazy loading
  const {
    items: vacations,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh
  } = useLazyLoading(fetchVacations, 6);

  // Fonctions utilitaires
  // Fonction pour obtenir la clé anglaise d'une spécialité française
  const getSpecialityKey = (specialityFr: string): string => {
    // Trouver la clé anglaise correspondante dans les données centralisées
    const entry = Object.entries(SPECIALITIES_DATA).find(([key, data]) => data.label === specialityFr);
    return entry ? entry[0] : specialityFr.toLowerCase();
  };

  // Compter les filtres actifs
  useEffect(() => {
    const count = Object.values(filters).filter(value => value !== '' && value !== 'newest').length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Rafraîchir quand les filtres changent
  useEffect(() => {
    // Vider le cache quand les filtres changent
    setSearchCache(new Map());
    refresh();
  }, [filters, searchTerm]);

  // Gestionnaires d'événements
  const handleSuggestionSelect = (suggestion: any) => {
    switch (suggestion.type) {
      case 'location':
        setFilters(prev => ({ ...prev, location: suggestion.value }));
        break;
      case 'speciality':
        setFilters(prev => ({ ...prev, speciality: suggestion.value }));
        break;
      case 'doctor':
        // Garder juste le terme de recherche pour les médecins
        break;
    }
  };

  const handleBookingRequest = (vacation: VacationWithDoctor) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour faire une demande de réservation",
        variant: "destructive",
      });
      navigate('/auth?type=establishment');
      return;
    }

    if (user.user_type !== 'establishment') {
      toast({
        title: "Accès restreint",
        description: "Cette fonctionnalité est réservée aux établissements",
        variant: "destructive",
      });
      return;
    }

    setSelectedVacation(vacation);
    setShowBookingModal(true);
  };

  const handleViewDoctorProfile = (vacation: VacationWithDoctor) => {
    navigate(`/doctor/${vacation.doctor_profiles.id}`);
  };

  const clearAllFilters = () => {
    setFilters({
      location: '',
      speciality: '',
      act_type: '',
      min_rate: '',
      max_rate: '',
      start_date: '',
      end_date: '',
      sort_by: 'newest'
    });
    setSearchTerm('');
  };

  const handleBookingSuccess = () => {
    toast({
      title: "Demande envoyée avec succès",
      description: "Le médecin recevra votre demande et vous contactera rapidement",
    });
    setShowBookingModal(false);
    setSelectedVacation(null);
  };

  // Statistiques en temps réel
  const stats = useMemo(() => {
    const totalVacations = vacations.length;
    const avgPrice = vacations.length > 0 
      ? vacations.reduce((sum, v) => sum + v.hourly_rate, 0) / vacations.length 
      : 0;
    const uniqueDoctors = new Set(vacations.map(v => v.doctor_id)).size;
    const avgRating = vacations.length > 0 
      ? vacations.reduce((sum, v) => sum + (v.doctor_profiles.average_rating || 0), 0) / vacations.length 
      : 0;

    return { totalVacations, avgPrice, uniqueDoctors, avgRating };
  }, [vacations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec recherche intelligente */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Trouvez le médecin parfait
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Recherchez parmi {stats.totalVacations} vacations disponibles avec notre système de suggestions intelligent
            </p>
          </div>

          {/* Barre de recherche intelligente */}
          <div className="max-w-2xl mx-auto mb-6">
            <SmartSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSuggestionSelect={handleSuggestionSelect}
              placeholder="Rechercher par médecin, spécialité, ville..."
              className="w-full"
            />
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-medical-blue">{stats.totalVacations}</div>
                <div className="text-sm text-gray-600">Vacations</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-medical-green">{Math.round(stats.avgPrice)}€</div>
                <div className="text-sm text-gray-600">Prix moyen/h</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.uniqueDoctors}</div>
                <div className="text-sm text-gray-600">Médecins</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-current" />
                  {stats.avgRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Note moyenne</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtres avancés */}
        <Card className="mb-6 bg-white/90 backdrop-blur border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres avancés
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Effacer tout
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="sort_by" className="text-sm text-gray-600 mr-2">
                  Trier par:
                </Label>
                <Select 
                  value={filters.sort_by} 
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, sort_by: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="location">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Localisation
                  </Label>
                  <Input
                    id="location"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ville, région..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="speciality">
                    <Stethoscope className="w-4 h-4 inline mr-1" />
                    Spécialité
                  </Label>
                  <Select 
                    value={filters.speciality} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, speciality: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes spécialités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes spécialités</SelectItem>
                      {SPECIALITIES.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="act_type">Type d'acte</Label>
                  <Select 
                    value={filters.act_type} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, act_type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Tous types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      {ACT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    <Euro className="w-4 h-4 inline mr-1" />
                    Prix (€/h)
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={filters.min_rate}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
                      placeholder="Min"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={filters.max_rate}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_rate: e.target.value }))}
                      placeholder="Max"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="start_date">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date de début
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Résultats avec lazy loading */}
        <div className="space-y-6">
          {/* En-tête des résultats */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Recherche en cours...' : `${vacations.length} résultat${vacations.length !== 1 ? 's' : ''} trouvé${vacations.length !== 1 ? 's' : ''}`}
            </h2>
            
            <Button
              variant="outline"
              onClick={refresh}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Liste des vacations avec lazy loading */}
          <LazyLoadContainer
            items={vacations}
            renderItem={(vacation, index) => (
              <DetailedDoctorCard
                key={vacation.id}
                vacation={vacation}
                onBookingRequest={() => handleBookingRequest(vacation)}
                onViewDetails={() => handleViewDoctorProfile(vacation)}
              />
            )}
            loadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            error={error}
            loadingComponent={<SkeletonGrid count={3} />}
            emptyState={
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Aucune vacation trouvée</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Essayez d'ajuster vos critères de recherche ou de supprimer certains filtres.
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Effacer les filtres
                  </Button>
                </CardContent>
              </Card>
            }
          />
        </div>
      </div>

      {/* Modal de réservation guidée */}
      <GuidedBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        vacation={selectedVacation}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
