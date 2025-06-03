import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VacationPost } from '@/types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const VacationStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vacations, setVacations] = useState<VacationPost[]>([]);

  useEffect(() => {
    if (user) {
      fetchVacations();
    }
  }, [user]);

  const fetchVacations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVacations(data || []);
    } catch (error: any) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyStats = () => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(new Date())
    });

    return months.map(month => {
      const monthVacations = vacations.filter(v => {
        const vacationDate = new Date(v.created_at);
        return vacationDate >= startOfMonth(month) && vacationDate <= endOfMonth(month);
      });

      return {
        month: format(month, 'MMM yyyy', { locale: fr }),
        total: monthVacations.length,
        available: monthVacations.filter(v => v.status === 'available').length,
        booked: monthVacations.filter(v => v.status === 'booked').length,
        completed: monthVacations.filter(v => v.status === 'completed').length,
        revenue: monthVacations
          .filter(v => v.status === 'completed')
          .reduce((sum, v) => sum + (v.hourly_rate * 8 * Math.ceil((new Date(v.end_date).getTime() - new Date(v.start_date).getTime()) / (1000 * 60 * 60 * 24))), 0)
      };
    });
  };

  const getStatusDistribution = () => {
    const statusCounts = vacations.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const getSpecialityDistribution = () => {
    const specialityCounts = vacations.reduce((acc, v) => {
      acc[v.speciality] = (acc[v.speciality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(specialityCounts).map(([speciality, count]) => ({
      name: speciality,
      value: count
    }));
  };

  if (loading) {
    return <div>Chargement des statistiques...</div>;
  }

  const monthlyStats = getMonthlyStats();
  const statusDistribution = getStatusDistribution();
  const specialityDistribution = getSpecialityDistribution();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle</CardTitle>
          <CardDescription>
            Nombre de vacations et revenus par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="total" name="Total" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="booked" name="Réservées" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="revenue" name="Revenus (€)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution par statut</CardTitle>
            <CardDescription>
              Répartition des vacations par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par spécialité</CardTitle>
            <CardDescription>
              Répartition des vacations par spécialité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialityDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {specialityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VacationStats; 