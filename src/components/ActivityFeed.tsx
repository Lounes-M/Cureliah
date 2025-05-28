
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  MessageSquare, 
  Euro, 
  User, 
  Building2, 
  CheckCircle, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  type: 'booking' | 'message' | 'payment' | 'profile' | 'vacation';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  relatedId?: string;
}

const ActivityFeed = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      // Fetch recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select('*')
        .or(`doctor_id.eq.${user.id},establishment_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsError) throw bookingsError;

      // Fetch recent notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsError) throw notificationsError;

      // Convert to unified activity format
      const bookingActivities: Activity[] = (bookings || []).map(booking => ({
        id: `booking-${booking.id}`,
        type: 'booking' as const,
        title: booking.doctor_id === user.id ? 'Nouvelle réservation reçue' : 'Réservation effectuée',
        description: `Statut: ${booking.status}`,
        timestamp: booking.created_at,
        status: booking.status,
        relatedId: booking.id
      }));

      const notificationActivities: Activity[] = (notifications || []).map(notification => ({
        id: `notification-${notification.id}`,
        type: 'message' as const,
        title: notification.title,
        description: notification.message,
        timestamp: notification.created_at,
        relatedId: notification.related_booking_id
      }));

      // Combine and sort by timestamp
      const allActivities = [...bookingActivities, ...notificationActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setActivities(allActivities);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le flux d'activité",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar;
      case 'message': return MessageSquare;
      case 'payment': return Euro;
      case 'profile': return User;
      case 'vacation': return Building2;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (status) {
      switch (status) {
        case 'pending': return 'text-yellow-600';
        case 'booked': return 'text-green-600';
        case 'cancelled': return 'text-red-600';
        case 'completed': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    }
    
    switch (type) {
      case 'booking': return 'text-blue-600';
      case 'message': return 'text-purple-600';
      case 'payment': return 'text-green-600';
      case 'profile': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure(s)`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Activité Récente
        </CardTitle>
        <CardDescription>
          Vos dernières actions et notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type, activity.status);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full bg-gray-100 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={fetchActivities}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Voir plus d'activités
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
