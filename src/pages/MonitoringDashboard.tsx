import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Server,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import MonitoringCache from '@/services/monitoringCache';
import MonitoringNotificationsPanel from '@/components/MonitoringNotificationsPanel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  user_agent: string;
  url: string;
  timestamp: string;
  user_id?: string;
  user_type?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  url?: string;
  user_id?: string;
  context?: any;
}

interface PerformanceAlert {
  id: string;
  metric_name: string;
  value: number;
  threshold: number;
  url?: string;
  user_id?: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

const MonitoringDashboard: React.FC = () => {
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const { toast } = useToast();
  const cache = MonitoringCache.getInstance();

  useEffect(() => {
    loadMonitoringData();
  }, [selectedTimeRange]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const timeFilter = getTimeFilter(selectedTimeRange);
      
      // Utiliser le cache pour charger les données
      const [errors, metrics, alerts] = await Promise.all([
        cache.getErrorReports(timeFilter),
        cache.getPerformanceMetrics(timeFilter),
        cache.getPerformanceAlerts(timeFilter)
      ]);

      setErrorReports(errors);
      setPerformanceMetrics(metrics);
      setPerformanceAlerts(alerts);

      // Charger le rapport de santé système
      const { data: healthData, error: healthError } = await supabase
        .rpc('get_system_health_report', { time_filter: timeFilter });

      if (healthError) {
        // TODO: Replace with logger.error('Error loading system health:', healthError);
      } else {
        setSystemHealth(healthData || []);
      }

    } catch (error) {
      // TODO: Replace with logger.error('Error loading monitoring data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de monitoring",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeFilter = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from('error_reports')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', errorId);

      if (error) throw error;

      setErrorReports(prev => 
        prev.map(err => 
          err.id === errorId 
            ? { ...err, resolved: true, resolved_at: new Date().toISOString() }
            : err
        )
      );

      toast({
        title: "Succès",
        description: "Erreur marquée comme résolue",
      });
    } catch (error) {
      // TODO: Replace with logger.error('Error resolving error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'erreur comme résolue",
        variant: "destructive",
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('performance_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', alertId);

      if (error) throw error;

      setPerformanceAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
            : alert
        )
      );

      toast({
        title: "Succès",
        description: "Alerte marquée comme résolue",
      });
    } catch (error) {
      // TODO: Replace with logger.error('Error resolving alert:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'alerte comme résolue",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPerformanceChartData = () => {
    const groupedMetrics = performanceMetrics.reduce((acc, metric) => {
      const hour = new Date(metric.timestamp).toISOString().substring(0, 13);
      if (!acc[hour]) {
        acc[hour] = {};
      }
      if (!acc[hour][metric.name]) {
        acc[hour][metric.name] = [];
      }
      acc[hour][metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, Record<string, number[]>>);

    return Object.entries(groupedMetrics).map(([hour, metrics]) => ({
      time: new Date(hour + ':00:00').toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      'page-load-time': metrics['page-load-time'] ? 
        metrics['page-load-time'].reduce((a, b) => a + b, 0) / metrics['page-load-time'].length : 0,
      'first-contentful-paint': metrics['first-contentful-paint'] ? 
        metrics['first-contentful-paint'].reduce((a, b) => a + b, 0) / metrics['first-contentful-paint'].length : 0,
      'largest-contentful-paint': metrics['largest-contentful-paint'] ? 
        metrics['largest-contentful-paint'].reduce((a, b) => a + b, 0) / metrics['largest-contentful-paint'].length : 0,
    })).slice(-24);
  };

  const getErrorStats = () => {
    const total = errorReports.length;
    const resolved = errorReports.filter(err => err.resolved).length;
    const critical = errorReports.filter(err => err.severity === 'critical').length;
    const high = errorReports.filter(err => err.severity === 'high').length;
    
    return { total, resolved, critical, high, unresolved: total - resolved };
  };

  const errorStats = getErrorStats();
  const chartData = getPerformanceChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Surveillez les erreurs et performances de la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <MonitoringNotificationsPanel />
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Dernière heure</option>
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
          </select>
          <Button onClick={loadMonitoringData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Rapport de santé système */}
      {systemHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              État de Santé du Système
            </CardTitle>
            <CardDescription>Vue d'ensemble de la santé de la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemHealth.map((health, index) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'healthy': return 'text-medical-green bg-green-50 border-green-200';
                    case 'caution': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                    case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
                    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
                    default: return 'text-gray-600 bg-gray-50 border-gray-200';
                  }
                };

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'healthy': return <CheckCircle className="h-5 w-5" />;
                    case 'caution': return <Activity className="h-5 w-5" />;
                    case 'warning': return <AlertTriangle className="h-5 w-5" />;
                    case 'critical': return <XCircle className="h-5 w-5" />;
                    default: return <Server className="h-5 w-5" />;
                  }
                };

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(health.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health.status)}
                        <h3 className="font-medium capitalize">{health.metric_type}</h3>
                      </div>
                      <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                        {health.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-1">{health.message}</p>
                    <p className="text-xs opacity-75">
                      Valeur actuelle: {Math.round(health.value * 100) / 100}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Erreurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {errorStats.unresolved} non résolues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs Critiques</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention immédiate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Performance</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {performanceAlerts.filter(a => !a.resolved).length} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Résolution</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {errorStats.total > 0 ? Math.round((errorStats.resolved / errorStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {errorStats.resolved} erreurs résolues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Erreurs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports d'Erreurs</CardTitle>
              <CardDescription>
                Liste des erreurs détectées sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorReports.map((error) => (
                  <div
                    key={error.id}
                    className={`p-4 border rounded-lg ${
                      error.resolved ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(error.severity)}
                          <Badge variant={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(error.timestamp).toLocaleString('fr-FR')}
                          </span>
                          {error.resolved && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Résolu
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{error.message}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          URL: {error.url}
                        </p>
                        {error.user_type && (
                          <p className="text-sm text-muted-foreground">
                            Type d'utilisateur: {error.user_type}
                          </p>
                        )}
                      </div>
                      {!error.resolved && (
                        <Button
                          onClick={() => resolveError(error.id)}
                          variant="outline"
                          size="sm"
                        >
                          Marquer comme résolu
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {errorReports.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune erreur détectée dans cette période
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
              <CardDescription>
                Évolution des performances au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="page-load-time" 
                      stroke="#8884d8" 
                      name="Temps de chargement (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="first-contentful-paint" 
                      stroke="#82ca9d" 
                      name="First Contentful Paint (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="largest-contentful-paint" 
                      stroke="#ffc658" 
                      name="Largest Contentful Paint (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Performance</CardTitle>
              <CardDescription>
                Seuils de performance dépassés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceAlerts.map((alert) => (
                  <Alert key={alert.id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong>{alert.metric_name}</strong>
                            {alert.resolved && (
                              <Badge variant="outline">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Résolu
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">
                            Valeur: {alert.value.toFixed(2)} | Seuil: {alert.threshold}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString('fr-FR')}
                          </p>
                          {alert.url && (
                            <p className="text-sm text-muted-foreground">
                              URL: {alert.url}
                            </p>
                          )}
                        </div>
                        {!alert.resolved && (
                          <Button
                            onClick={() => resolveAlert(alert.id)}
                            variant="outline"
                            size="sm"
                          >
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {performanceAlerts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune alerte de performance dans cette période
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
