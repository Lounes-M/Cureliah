
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, TrendingUp, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import BookingManagement from '@/components/BookingManagement';
import InteractiveCalendar from '@/components/InteractiveCalendar';

interface DashboardStats {
  totalVacations: number;
  activeBookings: number;
  totalRevenue: number;
  completedMissions: number;
}

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalVacations: 0,
    activeBookings: 0,
    totalRevenue: 0,
    completedMissions: 0
  });
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
        .select('*')
        .eq('doctor_id', user.id);

      if (bookingsError) throw bookingsError;

      const stats = {
        totalVacations: vacations?.length || 0,
        activeBookings: bookings?.filter(b => b.status === 'booked').length || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        completedMissions: bookings?.filter(b => b.status === 'completed').length || 0
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
            Bienvenue sur votre espace médecin
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/create-vacation')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créer une vacation</CardTitle>
              <Plus className="h-4 w-4 text-medical-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-blue">Nouvelle</div>
              <p className="text-xs text-muted-foreground">
                Publier une nouvelle vacation
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/bookings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
              <BookOpen className="h-4 w-4 text-medical-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-green">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                Réservations actives
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
            trend={stats.totalVacations > 0 ? { value: 15, label: "ce mois" } : undefined}
            description="Total des annonces"
          />
          <StatsCard
            title="Réservations actives"
            value={stats.activeBookings}
            icon={TrendingUp}
            trend={stats.activeBookings > 0 ? { value: 8, label: "cette semaine" } : undefined}
            description="En cours"
          />
          <StatsCard
            title="Revenus totaux"
            value={stats.totalRevenue}
            icon={Users}
            trend={stats.totalRevenue > 0 ? { value: 12, label: "ce mois" } : undefined}
            description="€ générés"
          />
          <StatsCard
            title="Missions terminées"
            value={stats.completedMissions}
            icon={BookOpen}
            trend={stats.completedMissions > 0 ? { value: 5, label: "ce mois" } : undefined}
            description="Avec succès"
          />
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <InteractiveCalendar />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Gérez vos vacations et réservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/doctor/create-vacation')} 
                className="w-full bg-medical-blue hover:bg-medical-blue-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une nouvelle vacation
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/bookings')} 
                className="w-full"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Voir mes réservations
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile/complete')} 
                className="w-full"
              >
                Gérer mon profil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Vos dernières actions sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Management */}
        <BookingManagement />
      </div>
    </div>
  );
};

export default DoctorDashboard;
