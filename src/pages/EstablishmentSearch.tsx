import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, User, Clock, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { VacationPost } from '@/types/database';
import { getSpecialityInfo } from '@/utils/specialities';
import BookingRequestModal from '@/components/establishment/BookingRequestModal';
import VacationFilters from '@/components/establishment/VacationFilters';

interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  experience_years?: number;
}

interface VacationWithDoctor extends VacationPost {
  doctor_info: DoctorInfo | null;
}

interface FilterState {
  location: string;
  speciality: string;
  startDate: string;
  endDate: string;
  minRate: string;
  maxRate: string;
}

const EstablishmentSearch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationWithDoctor[]>([]);
  const [filteredVacations, setFilteredVacations] = useState<VacationWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<VacationWithDoctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    speciality: '',
    startDate: '',
    endDate: '',
    minRate: '',
    maxRate: ''
  });

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.user_type !== 'establishment') {
      navigate('/doctor/dashboard');
      return;
    }

    fetchVacations();
  }, [user, profile, navigate]);

  useEffect(() => {
    applyFilters();
  }, [vacations, searchTerm, filters]);

  const fetchVacations = async () => {
    try {
      // Récupérer les vacations disponibles
      const { data: vacationsData, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (vacationsError) throw vacationsError;

      if (!vacationsData || vacationsData.length === 0) {
        setVacations([]);
        setFilteredVacations([]);
        return;
      }

      // Récupérer les informations des médecins
      const doctorIds = vacationsData.map(vacation => vacation.doctor_id);
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', doctorIds);

      if (doctorsError) {
        console.warn('Error fetching doctor profiles:', doctorsError);
      }

      // Récupérer les informations détaillées des médecins
      const { data: doctorProfiles, error: doctorProfilesError } = await supabase
        .from('doctor_profiles')
        .select('id, experience_years')
        .in('id', doctorIds);

      if (doctorProfilesError) {
        console.warn('Error fetching doctor detailed profiles:', doctorProfilesError);
      }

      // Combiner les données
      const combinedVacations = vacationsData.map(vacation => ({
        ...vacation,
        doctor_info: {
          ...(doctorsData && doctorsData.length > 0 ? doctorsData.find(doc => doc.id === vacation.doctor_id) : {}),
          ...(doctorProfiles && doctorProfiles.length > 0 ? doctorProfiles.find(dp => dp.id === vacation.doctor_id) : {})
        } || null
      }));

      setVacations(combinedVacations as VacationWithDoctor[]);
    } catch (error: any) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vacations];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(vacation =>
        vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vacation.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vacation.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${vacation.doctor_info?.first_name} ${vacation.doctor_info?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtres avancés
    if (filters.location) {
      filtered = filtered.filter(vacation =>
        vacation.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.speciality) {
      filtered = filtered.filter(vacation =>
        vacation.speciality === filters.speciality
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(vacation =>
        new Date(vacation.start_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(vacation =>
        new Date(vacation.end_date) <= new Date(filters.endDate)
      );
    }

    if (filters.minRate) {
      filtered = filtered.filter(vacation =>
        vacation.hourly_rate >= parseFloat(filters.minRate)
      );
    }

    if (filters.maxRate) {
      filtered = filtered.filter(vacation =>
        vacation.hourly_rate <= parseFloat(filters.maxRate)
      );
    }

    setFilteredVacations(filtered);
  };

  const handleBookingRequest = (vacation: VacationWithDoctor) => {
    setSelectedVacation(vacation);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    setSelectedVacation(null);
    toast({
      title: "Demande envoyée",
      description: "Votre demande de réservation a été envoyée au médecin",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement des vacations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rechercher des vacations
          </h1>
          <p className="text-gray-600">
            Trouvez des médecins disponibles pour vos besoins
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par titre, localisation, spécialité ou médecin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mb-6">
            <VacationFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                location: '',
                speciality: '',
                startDate: '',
                endDate: '',
                minRate: '',
                maxRate: ''
              })}
            />
          </div>
        )}

        {/* Résultats */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredVacations.length} vacation{filteredVacations.length > 1 ? 's' : ''} trouvée{filteredVacations.length > 1 ? 's' : ''}
            </h2>
          </div>
        </div>

        {filteredVacations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune vacation trouvée
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredVacations.map((vacation) => (
              <VacationCard
                key={vacation.id}
                vacation={vacation}
                onBookingRequest={() => handleBookingRequest(vacation)}
              />
            ))}
          </div>
        )}

        {/* Modal de demande de réservation */}
        {selectedVacation && (
          <BookingRequestModal
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedVacation(null);
            }}
            vacation={selectedVacation}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
};

interface VacationCardProps {
  vacation: VacationWithDoctor;
  onBookingRequest: () => void;
}

const VacationCard = ({ vacation, onBookingRequest }: VacationCardProps) => {
  const specialityInfo = getSpecialityInfo(vacation.speciality || '');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{vacation.title}</CardTitle>
            <CardDescription className="text-base">
              Dr. {vacation.doctor_info?.first_name} {vacation.doctor_info?.last_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-medical-green">
              {vacation.hourly_rate}€/h
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                Du {new Date(vacation.start_date).toLocaleDateString('fr-FR')} au {new Date(vacation.end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span>{vacation.location || 'Localisation à définir'}</span>
            </div>
            {vacation.speciality && (
              <div className="flex items-center text-sm">
                <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue">
                  {specialityInfo?.label || vacation.speciality}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {vacation.doctor_info?.experience_years ? 
                  `${vacation.doctor_info.experience_years} années d'expérience` : 
                  'Expérience non spécifiée'
                }
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
              </span>
            </div>
          </div>
        </div>

        {vacation.description && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 text-sm">{vacation.description}</p>
          </div>
        )}

        {vacation.requirements && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Exigences</h4>
            <p className="text-gray-600 text-sm">{vacation.requirements}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Publié le {new Date(vacation.created_at).toLocaleDateString('fr-FR')}
          </div>
          <Button 
            onClick={onBookingRequest}
            className="bg-medical-green hover:bg-medical-green-dark"
          >
            Faire une demande
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstablishmentSearch;
