
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Calendar, TrendingUp, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
}

const EstablishmentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.user_type !== 'establishment') {
      navigate('/doctor/dashboard');
      return;
    }

    // Check if profile is complete
    checkProfileCompletion();
    fetchStats();
  }, [user, profile]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    try {
      const { data: establishmentProfile } = await supabase
        .from('establishment_profiles')
        .select('name, establishment_type')
        .eq('id', user.id)
        .single();

      if (!establishmentProfile || !establishmentProfile.name || !establishmentProfile.establishment_type) {
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
      const { data: bookings, error } = await supabase
        .from('vacation_bookings')
        .select('status')
        .eq('establishment_id', user.id);

      if (error) throw error;

      const stats = {
        totalBookings: bookings?.length || 0,
        pendingBookings: bookings?.filter(b => b.status === 'pending').length || 0,
        confirmedBookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
        completedBookings: bookings?.filter(b => b.status === 'completed').length || 0
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
            Tableau de bord - Établissement
          </h1>
          <p className="text-gray-600">
            Bienvenue sur votre espace établissement
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/search')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechercher des vacations</CardTitle>
              <Search className="h-4 w-4 text-medical-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-green">Explorer</div>
              <p className="text-xs text-muted-foreground">
                Trouvez des médecins disponibles
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/bookings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
              <BookOpen className="h-4 w-4 text-medical-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-blue">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Réservations au total
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
            title="Réservations en attente"
            value={stats.pendingBookings}
            icon={Calendar}
            trend={stats.pendingBookings > 0 ? "up" : "neutral"}
            description="Demandes à traiter"
          />
          <StatsCard
            title="Réservations confirmées"
            value={stats.confirmedBookings}
            icon={TrendingUp}
            trend={stats.confirmedBookings > 0 ? "up" : "neutral"}
            description="Vacations réservées"
          />
          <StatsCard
            title="Missions terminées"
            value={stats.completedBookings}
            icon={MapPin}
            trend={stats.completedBookings > 0 ? "up" : "neutral"}
            description="Collaborations réussies"
          />
          <StatsCard
            title="Total réservations"
            value={stats.totalBookings}
            icon={BookOpen}
            trend={stats.totalBookings > 0 ? "up" : "neutral"}
            description="Toutes périodes"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations</CardTitle>
              <CardDescription>
                Actions recommandées pour optimiser vos réservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.totalBookings === 0 ? (
                <div className="text-center py-6">
                  <Search className="w-8 h-8 mx-auto mb-3 text-medical-green" />
                  <h3 className="font-medium text-gray-900 mb-2">Commencez par rechercher</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Explorez les vacations disponibles et trouvez les médecins qui correspondent à vos besoins.
                  </p>
                  <Button onClick={() => navigate('/search')} className="bg-medical-green hover:bg-medical-green-dark">
                    Rechercher des vacations
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-medical-green rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Complétez votre profil</p>
                      <p className="text-xs text-gray-600">Ajoutez plus d'informations pour attirer les médecins</p>
                    </div>
                  </div>
                  {stats.pendingBookings > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Réservations en attente</p>
                        <p className="text-xs text-gray-600">Vous avez {stats.pendingBookings} demande(s) en attente</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
