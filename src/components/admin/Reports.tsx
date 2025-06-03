import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Building2, Calendar as CalendarIcon, FileText, AlertCircle, DollarSign } from 'lucide-react';

interface ReportData {
  totalUsers: number;
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

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
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
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [reportType, setReportType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Récupérer les statistiques de base
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: establishmentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'establishment');

      const { count: vacationsCount } = await supabase
        .from('vacations')
        .select('*', { count: 'exact', head: true });

      const { count: documentsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Récupérer les revenus
      const { data: payments } = await supabase
        .from('payments')
        .select('amount');

      const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculer les taux de croissance
      const userGrowth = 5; // À remplacer par un calcul réel
      const establishmentGrowth = 3; // À remplacer par un calcul réel
      const vacationGrowth = 8; // À remplacer par un calcul réel
      const revenueGrowth = 12; // À remplacer par un calcul réel

      setReportData({
        totalUsers: usersCount || 0,
        totalEstablishments: establishmentsCount || 0,
        totalVacations: vacationsCount || 0,
        totalDocuments: documentsCount || 0,
        totalReports: reportsCount || 0,
        totalRevenue,
        userGrowth,
        establishmentGrowth,
        vacationGrowth,
        revenueGrowth
      });
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du rapport",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Utilisateurs",
      value: reportData.totalUsers,
      growth: reportData.userGrowth,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-100"
    },
    {
      title: "Établissements",
      value: reportData.totalEstablishments,
      growth: reportData.establishmentGrowth,
      icon: Building2,
      color: "text-green-500",
      bgColor: "bg-green-100"
    },
    {
      title: "Vacations",
      value: reportData.totalVacations,
      growth: reportData.vacationGrowth,
      icon: CalendarIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-100"
    },
    {
      title: "Documents",
      value: reportData.totalDocuments,
      icon: FileText,
      color: "text-orange-500",
      bgColor: "bg-orange-100"
    },
    {
      title: "Rapports",
      value: reportData.totalReports,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-100"
    },
    {
      title: "Revenus",
      value: `${reportData.totalRevenue.toLocaleString('fr-FR')} €`,
      growth: reportData.revenueGrowth,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Type de rapport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rapports</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
              <SelectItem value="establishments">Établissements</SelectItem>
              <SelectItem value="vacations">Vacations</SelectItem>
              <SelectItem value="revenue">Revenus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Calendar
            mode="range"
            selected={{
              from: dateRange.from,
              to: dateRange.to
            }}
            onSelect={(range) => {
              if (range) {
                setDateRange({
                  from: range.from,
                  to: range.to
                });
              }
            }}
            className="rounded-md border"
          />
        </div>
        <div className="flex items-end">
          <Button>
            Exporter le rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      {stat.growth && (
                        <span className={`ml-2 text-sm ${
                          stat.growth > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stat.growth > 0 ? '+' : ''}{stat.growth}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 