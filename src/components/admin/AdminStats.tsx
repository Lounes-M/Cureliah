import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Users, Building2, Calendar, FileText, AlertCircle, Euro, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalDoctors: number;
  totalEstablishments: number;
  totalVacations: number;
  totalDocuments: number;
  totalReports: number;
  totalRevenue: number;
  userGrowth: number;
  establishmentGrowth: number;
  vacationGrowth: number;
  revenueGrowth: number;
}

export default function AdminStats() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalDoctors: 0,
    totalEstablishments: 0,
    totalVacations: 0,
    totalDocuments: 0,
    totalReports: 0,
    totalRevenue: 0,
    userGrowth: 0,
    establishmentGrowth: 0,
    vacationGrowth: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get last month's start and end dates
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch current month's data
      const [
        { count: currentUsers },
        { count: currentDoctors },
        { count: currentEstablishments },
        { count: currentVacations },
        { count: currentDocuments },
        { count: currentReports },
        { data: currentPayments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'doctor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'establishment'),
        supabase.from('vacations').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString())
      ]);

      // Fetch last month's data for growth calculation
      const [
        { count: lastMonthUsers },
        { count: lastMonthEstablishments },
        { count: lastMonthVacations },
        { data: lastMonthPayments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'establishment').lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('vacations').select('*', { count: 'exact', head: true }).lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('payments').select('amount').gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString())
      ]);

      // Calculate current month's revenue
      const currentRevenue = currentPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const lastMonthRevenue = lastMonthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate growth rates
      const userGrowth = lastMonthUsers ? ((currentUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;
      const establishmentGrowth = lastMonthEstablishments ? ((currentEstablishments - lastMonthEstablishments) / lastMonthEstablishments) * 100 : 0;
      const vacationGrowth = lastMonthVacations ? ((currentVacations - lastMonthVacations) / lastMonthVacations) * 100 : 0;
      const revenueGrowth = lastMonthRevenue ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      setStats({
        totalUsers: currentUsers || 0,
        totalDoctors: currentDoctors || 0,
        totalEstablishments: currentEstablishments || 0,
        totalVacations: currentVacations || 0,
        totalDocuments: currentDocuments || 0,
        totalReports: currentReports || 0,
        totalRevenue: currentRevenue,
        userGrowth,
        establishmentGrowth,
        vacationGrowth,
        revenueGrowth
      });
    } catch (error) {
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

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      growth: stats.userGrowth,
      icon: Users,
      description: "Total des utilisateurs"
    },
    {
      title: "Établissements",
      value: stats.totalEstablishments,
      growth: stats.establishmentGrowth,
      icon: Building2,
      description: "Total des établissements"
    },
    {
      title: "Vacations",
      value: stats.totalVacations,
      growth: stats.vacationGrowth,
      icon: Calendar,
      description: "Total des vacations"
    },
    {
      title: "Documents",
      value: stats.totalDocuments,
      icon: FileText,
      description: "Total des documents"
    },
    {
      title: "Rapports",
      value: stats.totalReports,
      icon: AlertCircle,
      description: "Total des rapports"
    },
    {
      title: "Revenus",
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} €`,
      growth: stats.revenueGrowth,
      icon: Euro,
      description: "Revenus totaux"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.growth !== undefined && (
              <div className="flex items-center text-xs">
                {stat.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={stat.growth >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(stat.growth).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">vs mois dernier</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 