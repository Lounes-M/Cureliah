
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building2, Calendar, Users, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, EstablishmentProfile, VacationBooking } from '@/types/database';
import Header from '@/components/Header';
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations Actives</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myBookings.filter(b => ['pending', 'booked'].includes(b.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Médecins Disponibles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableVacations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Réservations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget ce mois</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{myBookings
                  .filter(b => b.payment_status === 'paid')
                  .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vacations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vacations">Vacations Disponibles</TabsTrigger>
            <TabsTrigger value="bookings">Mes Réservations</TabsTrigger>
          </TabsList>

          <TabsContent value="vacations">
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
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <EstablishmentBookingManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
