import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Send, 
  CheckCircle2, 
  Clock,
  Users,
  MapPin,
  Briefcase,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { RealAnalyticsService, RealAnalyticsData } from '@/services/realAnalytics';
import { useAuth } from '@/hooks/useAuth';

const RealAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [userMetrics, setUserMetrics] = useState<RealAnalyticsData['user_metrics'] | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<RealAnalyticsData['time_series']>([]);
  const [specialtyMetrics, setSpecialtyMetrics] = useState<RealAnalyticsData['specialty_metrics']>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, period]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [userMetricsData, timeSeriesData, specialtyData] = await Promise.all([
        RealAnalyticsService.getUserAnalytics(user.id, period),
        RealAnalyticsService.getTimeSeriesData(user.id, undefined, period),
        RealAnalyticsService.getSpecialtyMetrics()
      ]);

      setUserMetrics(userMetricsData);
      setTimeSeriesData(timeSeriesData);
      setSpecialtyMetrics(specialtyData.slice(0, 10)); // Top 10 specialties
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{trend}%
        </span>
      );
    } else if (trend < 0) {
      return (
        <span className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          {trend}%
        </span>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connexion requise</h3>
          <p className="text-gray-600">Connectez-vous pour voir vos analytics personnalisées</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Réelles</h1>
          <p className="text-gray-600">
            Dernière mise à jour: {lastUpdated.toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      {userMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vues du profil</p>
                  <p className="text-2xl font-bold">{userMetrics.profile_views}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                {formatTrend(userMetrics.profile_views_trend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Candidatures envoyées</p>
                  <p className="text-2xl font-bold">{userMetrics.applications_sent}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                {formatTrend(userMetrics.applications_trend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de réponse</p>
                  <p className="text-2xl font-bold">{userMetrics.response_rate.toFixed(1)}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2">
                {formatTrend(userMetrics.response_rate_trend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Temps de réponse moyen</p>
                  <p className="text-2xl font-bold">{userMetrics.avg_response_time}h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <Badge variant="outline">
                  Moyenne plateforme: 48h
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique temporel */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de l'activité</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#3B82F6" name="Candidatures" />
              <Line type="monotone" dataKey="views" stroke="#10B981" name="Vues profil" />
              <Line type="monotone" dataKey="matches" stroke="#F59E0B" name="Matches" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métriques par spécialité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demande par spécialité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialtyMetrics.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="specialty" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="demand_score" fill="#3B82F6" name="Score de demande" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Niveau de concurrence</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={specialtyMetrics.slice(0, 6)}
                  dataKey="demand_score"
                  nameKey="specialty"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {specialtyMetrics.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des spécialités détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée par spécialité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Spécialité</th>
                  <th className="text-center py-3">Score demande</th>
                  <th className="text-center py-3">Salaire moyen</th>
                  <th className="text-center py-3">Concurrence</th>
                  <th className="text-center py-3">Recommandation</th>
                </tr>
              </thead>
              <tbody>
                {specialtyMetrics.map((specialty, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4 font-medium">{specialty.specialty}</td>
                    <td className="text-center py-4">
                      <Badge variant="outline">{specialty.demand_score}/100</Badge>
                    </td>
                    <td className="text-center py-4">
                      {specialty.avg_salary.toLocaleString('fr-FR')}€
                    </td>
                    <td className="text-center py-4">
                      <Badge 
                        style={{ backgroundColor: getCompetitionColor(specialty.competition_level) }}
                        className="text-white"
                      >
                        {specialty.competition_level}
                      </Badge>
                    </td>
                    <td className="text-center py-4">
                      {specialty.competition_level === 'low' && specialty.demand_score > 50 ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Opportunité
                        </Badge>
                      ) : (
                        <Badge variant="outline">Surveiller</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights et recommandations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Insights personnalisés</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 mt-0.5 text-blue-600" />
              <div>
                <h4 className="font-medium mb-1">Performance en hausse</h4>
                <p className="text-sm">
                  Votre taux de réponse a augmenté de {userMetrics?.response_rate_trend}% 
                  ce {period === '7d' ? 'mois' : 'trimestre'}.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-blue-600" />
              <div>
                <h4 className="font-medium mb-1">Opportunités géographiques</h4>
                <p className="text-sm">
                  Considérez élargir votre recherche aux régions limitrophes 
                  pour augmenter vos opportunités de 25%.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealAnalyticsDashboard;
