
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Clock, MapPin, Euro, Users, TrendingUp, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationPost, DoctorProfile } from '@/types/database';
import UserNavigation from '@/components/UserNavigation';
import BookingManagement from '@/components/BookingManagement';
import StatsCard from '@/components/StatsCard';
import VacationCard from '@/components/VacationCard';
import ProfileCompletion from '@/components/ProfileCompletion';
import ActivityFeed from '@/components/ActivityFeed';
import { useToast } from '@/hooks/use-toast';

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [vacationPosts, setVacationPosts] = useState<VacationPost[]>([]);
  const [bookingsCount, setBookingsCount] = useState({
    pending: 0,
    booked: 0,
    total: 0
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.user_type !== 'doctor') {
      navigate('/');
      return;
    }

    fetchDoctorData();
  }, [user, profile]);

  const fetchDoctorData = async () => {
    if (!user) return;

    try {
      // Fetch doctor profile
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') {
        throw doctorError;
      }

      setDoctorProfile(doctorData);

      // Fetch vacation posts
      const { data: postsData, error: postsError } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setVacationPosts(postsData || []);

      // Fetch bookings count
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select('status, total_amount, created_at')
        .eq('doctor_id', user.id);

      if (bookingsError) throw bookingsError;

      const counts = bookingsData?.reduce((acc, booking) => {
        acc.total++;
        if (booking.status === 'pending') acc.pending++;
        if (booking.status === 'booked') acc.booked++;
        return acc;
      }, { pending: 0, booked: 0, total: 0 }) || { pending: 0, booked: 0, total: 0 };

      setBookingsCount(counts);

      // Calculate monthly earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTotal = bookingsData?.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               booking.total_amount;
      }).reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

      setMonthlyEarnings(monthlyTotal);

    } catch (error: any) {
      console.error('Error fetching doctor data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
            Bonjour Dr. {profile?.last_name || 'Médecin'}
          </h1>
          <p className="text-gray-600">
            Gérez vos disponibilités et suivez vos vacations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Vacations"
            value={vacationPosts.length}
            description="Vacations publiées"
            icon={Calendar}
            iconColor="text-medical-blue"
          />
          
          <StatsCard
            title="Disponibles"
            value={vacationPosts.filter(p => p.status === 'available').length}
            description="Prêtes à être réservées"
            icon={Clock}
            iconColor="text-green-600"
          />
          
          <StatsCard
            title="Réservations"
            value={bookingsCount.total}
            description={`${bookingsCount.pending} en attente`}
            icon={Users}
            iconColor="text-blue-600"
          />
          
          <StatsCard
            title="Revenus ce mois"
            value={`€${monthlyEarnings.toLocaleString()}`}
            description="Revenus confirmés"
            icon={Euro}
            iconColor="text-green-600"
            trend={{
              value: 12,
              label: "vs mois dernier"
            }}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Vacations */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vacations Récentes</CardTitle>
                  <Button 
                    onClick={() => navigate('/vacation/create')}
                    disabled={!doctorProfile}
                    className="bg-medical-blue hover:bg-medical-blue-dark"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Vacation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vacationPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune vacation publiée
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Commencez par publier votre première vacation
                    </p>
                    <Button 
                      onClick={() => navigate('/vacation/create')}
                      disabled={!doctorProfile}
                    >
                      Publier une vacation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vacationPosts.slice(0, 3).map((vacation) => (
                      <VacationCard
                        key={vacation.id}
                        vacation={vacation}
                        showActions={false}
                      />
                    ))}
                    {vacationPosts.length > 3 && (
                      <Button variant="outline" className="w-full">
                        Voir toutes les vacations ({vacationPosts.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ProfileCompletion />
            
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-medical-blue hover:bg-medical-blue-dark"
                  onClick={() => navigate('/vacation/create')}
                  disabled={!doctorProfile}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Vacation
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/profile/complete')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Profil Médecin
                </Button>
              </CardContent>
            </Card>

            <ActivityFeed />

            {/* Performance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de réservation</span>
                  <span className="font-semibold text-green-600">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Note moyenne</span>
                  <span className="font-semibold">4.8/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vacations complétées</span>
                  <span className="font-semibold">{vacationPosts.filter(v => v.status === 'completed').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="vacations" className="space-y-6">
            <TabsList>
              <TabsTrigger value="vacations">Mes Vacations</TabsTrigger>
              <TabsTrigger value="bookings">
                Réservations 
                {bookingsCount.pending > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {bookingsCount.pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vacations" className="space-y-6">
              <div className="grid gap-6">
                {vacationPosts.map((vacation) => (
                  <VacationCard
                    key={vacation.id}
                    vacation={vacation}
                    showActions={true}
                    isEstablishment={false}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
