import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building2, Calendar, Users, Euro, Filter, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, EstablishmentProfile, VacationBooking } from '@/types/database';
import UserNavigation from '@/components/UserNavigation';
import StatsCard from '@/components/StatsCard';
import RecentVacations from '@/components/RecentVacations';
import { useToast } from '@/hooks/use-toast';
import EstablishmentBookingManagement from '@/components/EstablishmentBookingManagement';

const EstablishmentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishmentProfile, setEstablishmentProfile] = useState<EstablishmentProfile | null>(null);
  const [availableVacations, setAvailableVacations] = useState<VacationPost[]>([]);
  const [myBookings, setMyBookings] = useState<VacationBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.user_type !== 'establishment') {
      navigate('/');
      return;
    }

    fetchEstablishmentData();
  }, [user, profile]);

  const fetchEstablishmentData = async () => {
    if (!user) return;

    try {
      // Fetch establishment profile
      const { data: establishmentData, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (establishmentError && establishmentError.code !== 'PGRST116') {
        throw establishmentError;
      }

      setEstablishmentProfile(establishmentData);

      // Fetch available vacation posts
      const { data: vacationsData, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (vacationsError) throw vacationsError;

      setAvailableVacations(vacationsData || []);

      // Fetch my bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select('*')
        .eq('establishment_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      setMyBookings(bookingsData || []);
    } catch (error: any) {
      console.error('Error fetching establishment data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bookVacation = async (vacationPostId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .insert({
          vacation_post_id: vacationPostId,
          establishment_id: user.id,
          doctor_id: availableVacations.find(v => v.id === vacationPostId)?.doctor_id!,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Votre demande de réservation a été envoyée au médecin.",
      });

      fetchEstablishmentData();
    } catch (error: any) {
      console.error('Error booking vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande",
        variant: "destructive"
      });
    }
  };

  const filteredVacations = availableVacations.filter(vacation =>
    vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vacation.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vacation.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyBudget = myBookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue {establishmentProfile?.name || 'Établissement'}
          </h1>
          <p className="text-gray-600">
            Trouvez et réservez des médecins pour vos vacations
          </p>
        </div>

        {!establishmentProfile && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Complétez votre profil</CardTitle>
              <CardDescription className="text-yellow-700">
                Complétez votre profil établissement pour commencer à réserver des vacations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile/complete')}>
                Compléter mon profil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Réservations Actives"
            value={myBookings.filter(b => ['pending', 'booked'].includes(b.status)).length}
            description="En cours et confirmées"
            icon={Calendar}
            iconColor="text-medical-blue"
          />
          
          <StatsCard
            title="Médecins Disponibles"
            value={availableVacations.length}
            description="Prêts à être réservés"
            icon={Users}
            iconColor="text-green-600"
          />
          
          <StatsCard
            title="Total Réservations"
            value={myBookings.length}
            description="Depuis le début"
            icon={Building2}
            iconColor="text-blue-600"
          />
          
          <StatsCard
            title="Budget ce mois"
            value={`€${monthlyBudget.toLocaleString()}`}
            description="Dépenses confirmées"
            icon={Euro}
            iconColor="text-red-600"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Search and Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher des Médecins
                </CardTitle>
                <CardDescription>
                  Trouvez le médecin parfait pour vos besoins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher par spécialité, lieu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </div>

                {filteredVacations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune vacation disponible
                    </h3>
                    <p className="text-gray-600">
                      Aucune vacation ne correspond à vos critères de recherche
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVacations.slice(0, 5).map((vacation) => (
                      <div key={vacation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{vacation.title}</h4>
                            <p className="text-gray-600 text-sm">{vacation.description}</p>
                          </div>
                          <Button 
                            onClick={() => bookVacation(vacation.id)}
                            disabled={!establishmentProfile}
                            className="bg-medical-green hover:bg-medical-green-dark"
                          >
                            Réserver
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span>
                              {new Date(vacation.start_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">{vacation.speciality}</Badge>
                          </div>
                          <div className="flex items-center">
                            <Euro className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{vacation.hourly_rate}€/h</span>
                          </div>
                          {vacation.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="truncate">{vacation.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions and Recent Bookings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-medical-green hover:bg-medical-green-dark"
                  onClick={() => navigate('/establishment/dashboard')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Recherche Avancée
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/profile/complete')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Profil Établissement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mes Dernières Réservations</CardTitle>
              </CardHeader>
              <CardContent>
                {myBookings.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune réservation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Réservation #{booking.id.slice(0, 8)}</span>
                          <Badge variant="outline">{booking.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Recherche Avancée</TabsTrigger>
              <TabsTrigger value="bookings">Mes Réservations</TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher par spécialité, lieu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </div>
              </div>

              {filteredVacations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune vacation disponible
                    </h3>
                    <p className="text-gray-600">
                      Aucune vacation ne correspond à vos critères de recherche
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredVacations.map((vacation) => (
                    <Card key={vacation.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{vacation.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {vacation.description}
                            </CardDescription>
                          </div>
                          <Button 
                            onClick={() => bookVacation(vacation.id)}
                            disabled={!establishmentProfile}
                            className="bg-medical-green hover:bg-medical-green-dark"
                          >
                            Réserver
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span>
                              {new Date(vacation.start_date).toLocaleDateString('fr-FR')} - 
                              {new Date(vacation.end_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">{vacation.speciality}</Badge>
                          </div>
                          <div className="flex items-center">
                            <Euro className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{vacation.hourly_rate}€/h</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{vacation.location || 'Lieu non spécifié'}</span>
                          </div>
                        </div>
                        {vacation.requirements && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Exigences:</strong> {vacation.requirements}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings">
              <EstablishmentBookingManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
