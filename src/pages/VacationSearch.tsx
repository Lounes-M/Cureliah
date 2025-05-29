import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Clock, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { SPECIALITIES } from '@/utils/specialities';
import { getSpecialityInfo } from '@/utils/specialities';

interface VacationPost {
  id: string;
  title: string;
  description: string;
  speciality: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location: string;
  requirements: string;
  doctor_id: string;
  created_at: string;
  doctor_profiles?: {
    bio: string;
    experience_years: number;
    license_number: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface SearchFilters {
  speciality: string;
  location: string;
  minRate: string;
  maxRate: string;
  startDate: string;
  endDate: string;
}

const VacationSearch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    speciality: '',
    location: '',
    minRate: '',
    maxRate: '',
    startDate: '',
    endDate: ''
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
  }, [user, profile]);

  const fetchVacations = async (searchFilters?: SearchFilters) => {
    try {
      setSearchLoading(true);
      
      // First, get vacation posts with doctor_profiles relationship
      let vacationQuery = supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor_profiles(bio, experience_years, license_number)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      const currentFilters = searchFilters || filters;
      
      if (currentFilters.speciality) {
        vacationQuery = vacationQuery.eq('speciality', currentFilters.speciality);
      }
      
      if (currentFilters.location) {
        vacationQuery = vacationQuery.ilike('location', `%${currentFilters.location}%`);
      }
      
      if (currentFilters.minRate) {
        vacationQuery = vacationQuery.gte('hourly_rate', parseFloat(currentFilters.minRate));
      }
      
      if (currentFilters.maxRate) {
        vacationQuery = vacationQuery.lte('hourly_rate', parseFloat(currentFilters.maxRate));
      }
      
      if (currentFilters.startDate) {
        vacationQuery = vacationQuery.gte('start_date', currentFilters.startDate);
      }
      
      if (currentFilters.endDate) {
        vacationQuery = vacationQuery.lte('end_date', currentFilters.endDate);
      }

      const { data: vacationsData, error: vacationsError } = await vacationQuery;

      if (vacationsError) {
        console.error('Error fetching vacations:', vacationsError);
        throw vacationsError;
      }

      // Then get doctor profile information separately
      if (vacationsData && vacationsData.length > 0) {
        const doctorIds = vacationsData.map(vacation => vacation.doctor_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine the data
        const combinedData = vacationsData.map(vacation => ({
          ...vacation,
          profiles: profilesData?.find(profile => profile.id === vacation.doctor_id)
        }));

        setVacations(combinedData || []);
      } else {
        setVacations([]);
      }
    } catch (error: any) {
      console.error('Error in fetchVacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVacations(filters);
  };

  const handleBookVacation = async (vacationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .insert({
          vacation_post_id: vacationId,
          establishment_id: user.id,
          doctor_id: vacations.find(v => v.id === vacationId)?.doctor_id,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

      toast({
        title: "Réservation envoyée !",
        description: "Votre demande de réservation a été envoyée au médecin.",
      });

      // Refresh the list
      fetchVacations();
    } catch (error: any) {
      console.error('Error in handleBookVacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de réservation",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
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
            Trouvez et réservez des vacations médicales selon vos besoins
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Recherche et filtres
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Masquer' : 'Afficher'} les filtres
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="speciality">Spécialité</Label>
                  <Select 
                    value={filters.speciality} 
                    onValueChange={(value) => setFilters({...filters, speciality: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les spécialités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les spécialités</SelectItem>
                      {Object.entries(SPECIALITIES).map(([key, speciality]) => (
                        <SelectItem key={key} value={key}>
                          {speciality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    placeholder="Ville, région..."
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minRate">Tarif min (€/h)</Label>
                  <Input
                    id="minRate"
                    type="number"
                    placeholder="0"
                    value={filters.minRate}
                    onChange={(e) => setFilters({...filters, minRate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRate">Tarif max (€/h)</Label>
                  <Input
                    id="maxRate"
                    type="number"
                    placeholder="200"
                    value={filters.maxRate}
                    onChange={(e) => setFilters({...filters, maxRate: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? 'Recherche...' : 'Rechercher'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    speciality: '',
                    location: '',
                    minRate: '',
                    maxRate: '',
                    startDate: '',
                    endDate: ''
                  });
                  fetchVacations({
                    speciality: '',
                    location: '',
                    minRate: '',
                    maxRate: '',
                    startDate: '',
                    endDate: ''
                  });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {vacations.length} vacation{vacations.length > 1 ? 's' : ''} trouvée{vacations.length > 1 ? 's' : ''}
            </h2>
          </div>

          {vacations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
              {vacations.map((vacation) => {
                const specialityInfo = getSpecialityInfo(vacation.speciality);
                const doctorName = vacation.profiles 
                  ? `Dr. ${vacation.profiles.first_name} ${vacation.profiles.last_name}`
                  : 'Médecin';

                return (
                  <Card key={vacation.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold mb-2">
                            {vacation.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mb-2">
                            {vacation.description}
                          </CardDescription>
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Médecin :</strong> {doctorName}
                          </div>
                        </div>
                        <Badge className={specialityInfo.color}>
                          {specialityInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{calculateDuration(vacation.start_date, vacation.end_date)} jour(s)</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Euro className="w-4 h-4 mr-2" />
                            <span className="font-medium">{vacation.hourly_rate}€/heure</span>
                          </div>
                          {vacation.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{vacation.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {vacation.requirements && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Exigences :</strong> {vacation.requirements}
                          </p>
                        </div>
                      )}

                      {vacation.doctor_profiles && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Expérience :</strong> {vacation.doctor_profiles.experience_years || 'Non renseignée'} années
                          </p>
                          {vacation.doctor_profiles.bio && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Bio :</strong> {vacation.doctor_profiles.bio}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleBookVacation(vacation.id)}
                          className="bg-medical-green hover:bg-medical-green-dark"
                        >
                          Réserver cette vacation
                        </Button>
                        <Button variant="outline">
                          Contacter le médecin
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationSearch;
