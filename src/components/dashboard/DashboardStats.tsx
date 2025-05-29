
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
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
        .eq('user_id', user.id);

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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Réservations totales',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Réservations terminées',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-green-600',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.suffix && (
                      <p className="ml-2 text-sm text-gray-500">{stat.suffix}</p>
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
  );
};

export default DashboardStats;
