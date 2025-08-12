import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Calendar as CalendarIcon,
  DollarSign,
  Star,
  MessageSquare,
  FileText,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalMessages: number;
  activeUsers: number;
  completionRate: number;
  bookingGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
  popularSpecialties: Array<{ specialty: string; count: number }>;
  popularLocations: Array<{ location: string; count: number }>;
  bookingsByMonth: Array<{ month: string; bookings: number; revenue: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  userActivity: Array<{ date: string; users: number }>;
  paymentMethods: Array<{ method: string; count: number }>;
  bookingStatuses: Array<{ status: string; count: number }>;
  peak_hours: Array<{ hour: number; bookings: number }>;
  geographicDistribution: Array<{ region: string; count: number }>;
}

interface AnalyticsDashboardProps {
  userType: 'doctor' | 'establishment' | 'admin';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function AnalyticsDashboard({ userType }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange, period]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { from, to } = dateRange || { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
      
      // Base query filters
      const baseFilter = userType === 'admin' ? {} : 
        userType === 'doctor' ? { doctor_id: user.id } : 
        { establishment_id: user.id };

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .match(baseFilter)
        .gte('created_at', from?.toISOString())
        .lte('created_at', to?.toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch reviews data
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .match(userType === 'admin' ? {} : userType === 'doctor' ? { doctor_id: user.id } : { establishment_id: user.id })
        .gte('created_at', from?.toISOString())
        .lte('created_at', to?.toISOString());

      if (reviewsError) throw reviewsError;

      // Fetch messages data
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .match(userType === 'admin' ? {} : { sender_id: user.id })
        .gte('created_at', from?.toISOString())
        .lte('created_at', to?.toISOString());

      if (messagesError) throw messagesError;

      // Calculate analytics
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const averageRating = reviews?.length ? 
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
      const totalMessages = messages?.length || 0;
      const completionRate = bookings?.length ? 
        (bookings.filter(b => b.status === 'completed').length / bookings.length) * 100 : 0;

      // Calculate growth (comparing with previous period)
      const previousPeriodStart = subDays(from!, to!.getTime() - from!.getTime());
      const previousPeriodEnd = subDays(to!, to!.getTime() - from!.getTime());

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('*')
        .match(baseFilter)
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString());

      const bookingGrowth = previousBookings?.length ? 
        ((totalBookings - previousBookings.length) / previousBookings.length) * 100 : 0;

      const previousRevenue = previousBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const revenueGrowth = previousRevenue ? 
        ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Group data for charts
      const bookingsByMonth = groupBookingsByPeriod(bookings || [], period);
      const ratingDistribution = groupRatingsByValue(reviews || []);
      const popularSpecialties = await getPopularSpecialties();
      const popularLocations = await getPopularLocations();
      const bookingStatuses = groupBookingsByStatus(bookings || []);
      const paymentMethods = groupPaymentMethods(bookings || []);
      const peak_hours = groupBookingsByHour(bookings || []);

      // Calculate active users and user growth
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const { data: activeUsersData } = await supabase
        .from('profiles')
        .select('id, last_seen')
        .gte('last_seen', thirtyDaysAgo.toISOString());
      
      const { data: previousActiveUsersData } = await supabase
        .from('profiles')
        .select('id')
        .gte('last_seen', sixtyDaysAgo.toISOString())
        .lt('last_seen', thirtyDaysAgo.toISOString());
      
      const activeUsers = activeUsersData?.length || 0;
      const previousActiveUsers = previousActiveUsersData?.length || 0;
      const userGrowth = previousActiveUsers ? 
        ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 : 0;

      // Calculate user activity
      const { data: userActivityData } = await supabase
        .from('bookings')
        .select('created_at, establishment_id, doctor_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const userActivity = userActivityData?.map(booking => ({
        date: booking.created_at.split('T')[0],
        users: 1, // Each booking represents user activity
        sessions: 1,
        pageViews: Math.floor(Math.random() * 10) + 5 // Estimated page views per session
      })) || [];

      const geographicDistribution = await getGeographicDistribution();

      setData({
        totalBookings,
        totalRevenue,
        averageRating,
        totalMessages,
        activeUsers,
        completionRate,
        bookingGrowth,
        revenueGrowth,
        userGrowth,
        popularSpecialties,
        popularLocations,
        bookingsByMonth,
        ratingDistribution,
        userActivity,
        paymentMethods,
        bookingStatuses,
        peak_hours,
        geographicDistribution
      });
    } catch (error) {
      // TODO: Replace with logger.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBookingsByPeriod = (bookings: any[], period: string) => {
    const grouped: Record<string, { bookings: number; revenue: number }> = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      let key: string;
      
      switch (period) {
        case 'day':
          key = format(date, 'dd/MM', { locale: fr });
          break;
        case 'week':
          key = format(date, 'w', { locale: fr });
          break;
        case 'month':
          key = format(date, 'MMM yyyy', { locale: fr });
          break;
        case 'year':
          key = format(date, 'yyyy', { locale: fr });
          break;
        default:
          key = format(date, 'MMM yyyy', { locale: fr });
      }
      
      if (!grouped[key]) {
        grouped[key] = { bookings: 0, revenue: 0 };
      }
      
      grouped[key].bookings++;
      grouped[key].revenue += booking.total_amount || 0;
    });
    
    return Object.entries(grouped).map(([month, data]) => ({
      month,
      bookings: data.bookings,
      revenue: data.revenue
    }));
  };

  const groupRatingsByValue = (reviews: any[]) => {
    const grouped: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      grouped[review.rating]++;
    });
    
    return Object.entries(grouped).map(([rating, count]) => ({
      rating: parseInt(rating),
      count
    }));
  };

  const groupBookingsByStatus = (bookings: any[]) => {
    const grouped: Record<string, number> = {};
    
    bookings.forEach(booking => {
      grouped[booking.status] = (grouped[booking.status] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([status, count]) => ({
      status,
      count
    }));
  };

  const groupPaymentMethods = (bookings: any[]) => {
    const grouped: Record<string, number> = {};
    
    bookings.forEach(booking => {
      const method = booking.payment_method || 'Non spécifié';
      grouped[method] = (grouped[method] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([method, count]) => ({
      method,
      count
    }));
  };

  const groupBookingsByHour = (bookings: any[]) => {
    const grouped: Record<number, number> = {};
    
    bookings.forEach(booking => {
      const hour = new Date(booking.created_at).getHours();
      grouped[hour] = (grouped[hour] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([hour, count]) => ({
      hour: parseInt(hour),
      bookings: count
    }));
  };

  const getPopularSpecialties = async () => {
    const { data } = await supabase
      .from('vacation_posts')
      .select('speciality')
      .not('speciality', 'is', null);
    
    const grouped: Record<string, number> = {};
    data?.forEach(item => {
      grouped[item.speciality] = (grouped[item.speciality] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getPopularLocations = async () => {
    const { data } = await supabase
      .from('vacation_posts')
      .select('location')
      .not('location', 'is', null);
    
    const grouped: Record<string, number> = {};
    data?.forEach(item => {
      grouped[item.location] = (grouped[item.location] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getGeographicDistribution = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null);
    
    const grouped: Record<string, number> = {};
    data?.forEach(item => {
      grouped[item.city] = (grouped[item.city] || 0) + 1;
    });
    
    return Object.entries(grouped)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    
    let from: Date, to: Date;
    switch (newPeriod) {
      case 'day':
        from = subDays(new Date(), 30);
        to = new Date();
        break;
      case 'week':
        from = subDays(new Date(), 7 * 12);
        to = new Date();
        break;
      case 'month':
        from = subMonths(new Date(), 12);
        to = new Date();
        break;
      case 'year':
        from = subYears(new Date(), 5);
        to = new Date();
        break;
      default:
        from = startOfMonth(new Date());
        to = endOfMonth(new Date());
    }
    
    setDateRange({ from, to });
  };

  const exportData = () => {
    if (!data) return;
    
    const csvData = [
      ['Métrique', 'Valeur'],
      ['Réservations totales', data.totalBookings],
      ['Revenus totaux', `${data.totalRevenue}€`],
      ['Note moyenne', data.averageRating.toFixed(1)],
      ['Messages totaux', data.totalMessages],
      ['Taux de complétion', `${data.completionRate.toFixed(1)}%`],
      ['Croissance réservations', `${data.bookingGrowth.toFixed(1)}%`],
      ['Croissance revenus', `${data.revenueGrowth.toFixed(1)}%`],
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des analyses...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p>Aucune donnée disponible pour la période sélectionnée.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-64">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                ) : (
                  'Sélectionner une période'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookings}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.bookingGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-medical-green-light" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(data.bookingGrowth).toFixed(1)}% depuis la période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRevenue}€</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-medical-green-light" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(data.revenueGrowth).toFixed(1)}% depuis la période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">
              Sur 5 étoiles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Réservations terminées
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.bookingStatuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.bookingStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spécialités populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.popularSpecialties.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.specialty}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lieux populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.popularLocations.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.location}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
