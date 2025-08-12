import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Star, 
  Euro, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';

interface StatsData {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  documentsCount: number;
  unreadMessages: number;
}

interface DashboardStatsProps {
  userType: 'doctor' | 'establishment';
}

const DashboardStats = ({ userType }: DashboardStatsProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    documentsCount: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, userType]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch bookings
      const bookingsQuery = userType === 'doctor' 
        ? supabase.from('vacation_bookings').select('*').eq('doctor_id', user.id)
        : supabase.from('vacation_bookings').select('*').eq('establishment_id', user.id);

      const { data: bookings } = await bookingsQuery;

      // Fetch reviews
      const reviewsQuery = userType === 'doctor'
        ? supabase.from('reviews').select('rating').eq('doctor_id', user.id)
        : supabase.from('reviews').select('rating').eq('establishment_id', user.id);

      const { data: reviews } = await reviewsQuery;

      // Fetch documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Fetch unread messages
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .is('read_at', null);

      // Calculate stats
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const totalEarnings = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      
      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviews?.reduce((sum, r) => sum + r.rating, 0)! / totalReviews 
        : 0;

      setStats({
        totalBookings,
        completedBookings,
        pendingBookings,
        totalEarnings,
        averageRating,
        totalReviews,
        documentsCount: documents?.length || 0,
        unreadMessages: unreadMessages?.length || 0
      });
    } catch (error) {
      // TODO: Replace with logger.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Réservations totales',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-medical-blue',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Réservations terminées',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-medical-green',
      bgColor: 'bg-green-100'
    },
    {
      title: 'En attente',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: userType === 'doctor' ? 'Revenus totaux' : 'Dépenses totales',
      value: `${stats.totalEarnings.toLocaleString()} €`,
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Note moyenne',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      suffix: `/5 (${stats.totalReviews} avis)`
    },
    {
      title: 'Documents',
      value: stats.documentsCount,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{stat.title}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold truncate">{stat.value}</p>
                    {stat.suffix && (
                      <span className="ml-2 text-sm text-muted-foreground">{stat.suffix}</span>
                    )}
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full flex-shrink-0 ml-4`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
