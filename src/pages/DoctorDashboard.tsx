
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Euro, TrendingUp, Users, Clock, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import RecentVacations from '@/components/RecentVacations';
import { VacationPost } from '@/types/database';

interface DashboardStats {
  totalVacations: number;
  totalBookings: number;
  pendingBookings: number;
  totalEarnings: number;
}

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalVacations: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0
  });
  const [recentVacations, setRecentVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.user_type !== 'doctor') {
      navigate('/establishment/dashboard');
      return;
    }

    // Check if profile is complete
    checkProfileCompletion();
    fetchStats();
    fetchRecentVacations();
  }, [user, profile]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    try {
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('speciality, license_number')
        .eq('id', user.id)
        .single();

      if (!doctorProfile || !doctorProfile.speciality || !doctorProfile.license_number) {
        navigate('/profile/complete');
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      navigate('/profile/complete');
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch vacation posts
      const { data: vacations, error: vacationsError } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id);

      if (vacationsError) throw vacationsError;

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select('status, total_amount')
        .eq('doctor_id', user.id);

      if (bookingsError) throw bookingsError;

      const totalEarnings = bookings?.reduce((sum, booking) => {
        return sum + (booking.total_amount || 0);
      }, 0) || 0;

      const stats = {
        totalVacations: vacations?.length || 0,
        totalBookings: bookings?.length || 0,
        pendingBookings: bookings?.filter(b => b.status === 'pending').length || 0,
        totalEarnings
      };

      setStats(stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentVacations = async () => {
    if (!user) return;

    try {
      const { data: vacations, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentVacations(vacations || []);
    } catch (error: any) {
      console.error('Error fetching recent vacations:', error);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord - Médecin
          </h1>
          <p className="text-gray-600">
            Gérez vos vacations et suivez votre activité
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/create-vacation')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créer une vacation</CardTitle>
              <Plus className="h-4 w-4 text-medical-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-blue">Publier</div>
              <p className="text-xs text-muted-foreground">
                Nouvelle vacation disponible
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/bookings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
              <BookOpen className="h-4 w-4 text-medical-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-green">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Demandes reçues
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/profile/complete')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mon profil</CardTitle>
              <Users className="h-4 w-4 text-medical-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-gray">Gérer</div>
              <p className="text-xs text-muted-foreground">
                Modifier mes informations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Vacations publiées"
            value={stats.totalVacations}
            icon={Calendar}
            trend={stats.totalVacations > 0 ? "up" : "neutral"}
            description="Total créées"
          />
          <StatsCard
            title="Demandes reçues"
            value={stats.totalBookings}
            icon={Users}
            trend={stats.totalBookings > 0 ? "up" : "neutral"}
            description="Toutes demandes"
          />
          <StatsCard
            title="En attente"
            value={stats.pendingBookings}
            icon={Clock}
            trend={stats.pendingBookings > 0 ? "up" : "neutral"}
            description="À traiter"
          />
          <StatsCard
            title="Revenus"
            value={`${stats.totalEarnings}€`}
            icon={Euro}
            trend={stats.totalEarnings > 0 ? "up" : "neutral"}
            description="Total généré"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentVacations
            vacations={recentVacations}
            title="Mes vacations récentes"
            emptyMessage="Aucune vacation créée"
            onViewAll={() => navigate('/doctor/create-vacation')}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recommandations</CardTitle>
              <CardDescription>
                Actions recommandées pour optimiser vos vacations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.totalVacations === 0 ? (
                <div className="text-center py-6">
                  <Plus className="w-8 h-8 mx-auto mb-3 text-medical-blue" />
                  <h3 className="font-medium text-gray-900 mb-2">Créez votre première vacation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Commencez à publier vos disponibilités pour recevoir des demandes de réservation.
                  </p>
                  <Button onClick={() => navigate('/doctor/create-vacation')} className="bg-medical-blue hover:bg-medical-blue-dark">
                    Créer une vacation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-medical-blue rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Complétez votre profil</p>
                      <p className="text-xs text-gray-600">Ajoutez votre bio et photo pour attirer plus d'établissements</p>
                    </div>
                  </div>
                  {stats.pendingBookings > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Demandes en attente</p>
                        <p className="text-xs text-gray-600">Vous avez {stats.pendingBookings} demande(s) à traiter</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-medical-green rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Créez plus de vacations</p>
                      <p className="text-xs text-gray-600">Publiez régulièrement pour maximiser vos opportunités</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
