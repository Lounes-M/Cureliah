import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MonitoringNotification {
  id: string;
  type: 'error' | 'performance_alert' | 'system_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export function useMonitoringNotifications() {
  const [notifications, setNotifications] = useState<MonitoringNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let errorChannel: RealtimeChannel;
    let alertChannel: RealtimeChannel;

    const setupRealtimeSubscriptions = async () => {
      try {
        // Écouter les nouvelles erreurs
        errorChannel = supabase
          .channel('error_reports_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'error_reports',
              filter: 'severity=in.(high,critical)'
            },
            (payload) => {
              const error = payload.new as any;
              
              const notification: MonitoringNotification = {
                id: error.id,
                type: 'error',
                severity: error.severity,
                title: `Erreur ${error.severity === 'critical' ? 'Critique' : 'Importante'}`,
                message: error.message.substring(0, 100) + '...',
                timestamp: error.timestamp,
                data: error
              };

              setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Garder seulement 20 notifications

              // Afficher une toast pour les erreurs critiques
              if (error.severity === 'critical') {
                toast({
                  title: "🚨 Erreur Critique Détectée",
                  description: error.message.substring(0, 80) + '...',
                  variant: "destructive",
                  duration: 10000,
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('📡 Monitoring: Error reports subscription active');
            }
          });

        // Écouter les nouvelles alertes de performance
        alertChannel = supabase
          .channel('performance_alerts_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'performance_alerts'
            },
            (payload) => {
              const alert = payload.new as any;
              
              const notification: MonitoringNotification = {
                id: alert.id,
                type: 'performance_alert',
                severity: alert.value > alert.threshold * 2 ? 'high' : 'medium',
                title: 'Alerte Performance',
                message: `${alert.metric_name}: ${alert.value} (seuil: ${alert.threshold})`,
                timestamp: alert.timestamp,
                data: alert
              };

              setNotifications(prev => [notification, ...prev.slice(0, 19)]);

              toast({
                title: "⚠️ Alerte Performance",
                description: notification.message,
                variant: "default",
                duration: 5000,
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('📡 Monitoring: Performance alerts subscription active');
            }
          });

        setIsConnected(true);

      } catch (error) {
        console.error('Failed to setup monitoring notifications:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscriptions();

    // Charger les notifications récentes au démarrage
    loadRecentNotifications();

    return () => {
      if (errorChannel) {
        supabase.removeChannel(errorChannel);
      }
      if (alertChannel) {
        supabase.removeChannel(alertChannel);
      }
    };
  }, [toast]);

  const loadRecentNotifications = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Charger les erreurs récentes importantes
      const { data: errors } = await supabase
        .from('error_reports')
        .select('*')
        .gte('timestamp', oneHourAgo)
        .in('severity', ['high', 'critical'])
        .order('timestamp', { ascending: false })
        .limit(10);

      // Charger les alertes récentes
      const { data: alerts } = await supabase
        .from('performance_alerts')
        .select('*')
        .gte('timestamp', oneHourAgo)
        .order('timestamp', { ascending: false })
        .limit(10);

      const recentNotifications: MonitoringNotification[] = [];

      // Convertir les erreurs en notifications
      errors?.forEach(error => {
        recentNotifications.push({
          id: error.id,
          type: 'error',
          severity: error.severity,
          title: `Erreur ${error.severity === 'critical' ? 'Critique' : 'Importante'}`,
          message: error.message.substring(0, 100) + '...',
          timestamp: error.timestamp,
          data: error
        });
      });

      // Convertir les alertes en notifications
      alerts?.forEach(alert => {
        recentNotifications.push({
          id: alert.id,
          type: 'performance_alert',
          severity: alert.value > alert.threshold * 2 ? 'high' : 'medium',
          title: 'Alerte Performance',
          message: `${alert.metric_name}: ${alert.value} (seuil: ${alert.threshold})`,
          timestamp: alert.timestamp,
          data: alert
        });
      });

      // Trier par timestamp et prendre les 20 plus récents
      recentNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(recentNotifications.slice(0, 20));

    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.length;
  };

  const getCriticalCount = () => {
    return notifications.filter(n => n.severity === 'critical').length;
  };

  return {
    notifications,
    isConnected,
    markAsRead,
    clearAll,
    getUnreadCount,
    getCriticalCount,
    refreshNotifications: loadRecentNotifications
  };
}
