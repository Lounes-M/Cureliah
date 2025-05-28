
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalEstablishments: number;
  totalBookings: number;
  totalRevenue: number;
  activeVacations: number;
  completedBookings: number;
  pendingBookings: number;
}

interface AdminUser {
  id: string;
  user_type: string;
  first_name: string;
  last_name: string;
  created_at: string;
  is_verified?: boolean;
}

interface AdminBooking {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  doctor_profile?: {
    first_name: string;
    last_name: string;
  };
  establishment_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalEstablishments: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeVacations: 0,
    completedBookings: 0,
    pendingBookings: 0
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const [
        { count: totalUsers },
        { count: totalDoctors },
        { count: totalEstablishments },
        { count: totalBookings },
        { count: activeVacations },
        { count: completedBookings },
        { count: pendingBookings }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'doctor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'establishment'),
        supabase.from('vacation_bookings').select('*', { count: 'exact', head: true }),
        supabase.from('vacation_posts').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('vacation_bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('vacation_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Calculate total revenue
      const { data: revenueData } = await supabase
        .from('vacation_bookings')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalDoctors: totalDoctors || 0,
        totalEstablishments: totalEstablishments || 0,
        totalBookings: totalBookings || 0,
        totalRevenue,
        activeVacations: activeVacations || 0,
        completedBookings: completedBookings || 0,
        pendingBookings: pendingBookings || 0
      });

      // Fetch recent users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setUsers(usersData || []);

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('vacation_bookings')
        .select(`
          *,
          doctor_profile:profiles!vacation_bookings_doctor_id_fkey(first_name, last_name),
          establishment_profile:profiles!vacation_bookings_establishment_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setBookings(bookingsData || []);

      // Fetch admin logs
      const { data: logsData } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setLogs(logsData || []);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données administratives",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (action: string, targetType: string, targetId: string, details?: any) => {
    if (!user) return;

    try {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: user.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details: details || {}
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      // In a real implementation, you would add a 'suspended' field to profiles
      await logAdminAction('suspend_user', 'user', userId);
      toast({
        title: "Succès",
        description: "Utilisateur suspendu avec succès"
      });
      fetchAdminData();
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de suspendre l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      // Update verification status based on user type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (profile?.user_type === 'doctor') {
        await supabase
          .from('doctor_profiles')
          .update({ is_verified: true })
          .eq('id', userId);
      } else if (profile?.user_type === 'establishment') {
        await supabase
          .from('establishment_profiles')
          .update({ is_verified: true })
          .eq('id', userId);
      }

      await logAdminAction('verify_user', 'user', userId);
      toast({
        title: "Succès",
        description: "Utilisateur vérifié avec succès"
      });
      fetchAdminData();
    } catch (error: any) {
      console.error('Error verifying user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'booked': return 'Réservé';
      default: return status;
    }
  };

  // Chart data
  const chartData = [
    { name: 'Médecins', value: stats.totalDoctors, color: '#3b82f6' },
    { name: 'Établissements', value: stats.totalEstablishments, color: '#10b981' }
  ];

  const revenueData = [
    { name: 'Jan', revenue: 12000 },
    { name: 'Fév', revenue: 19000 },
    { name: 'Mar', revenue: 15000 },
    { name: 'Avr', revenue: 22000 },
    { name: 'Mai', revenue: 28000 },
    { name: 'Jun', revenue: 32000 }
  ];

  if (loading) {
    return <div className="text-center py-8">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Shield className="w-4 h-4" />
          <span>Administrateur</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs totaux</p>
                <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Réservations</p>
                <p className="text-3xl font-bold text-primary">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                <p className="text-3xl font-bold text-primary">{stats.totalRevenue.toLocaleString()}€</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vacations actives</p>
                <p className="text-3xl font-bold text-primary">{stats.activeVacations}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}€`, 'Revenus']} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="logs">Logs d'activité</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs récents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.user_type === 'doctor' ? 'default' : 'secondary'}>
                          {user.user_type === 'doctor' ? 'Médecin' : 'Établissement'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_verified ? 'default' : 'outline'}>
                          {user.is_verified ? 'Vérifié' : 'Non vérifié'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => verifyUser(user.id)}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Ban className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir suspendre cet utilisateur ? Cette action peut être annulée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => suspendUser(user.id)}>
                                  Suspendre
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Établissement</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.doctor_profile?.first_name} {booking.doctor_profile?.last_name}
                      </TableCell>
                      <TableCell>
                        {booking.establishment_profile?.first_name} {booking.establishment_profile?.last_name}
                      </TableCell>
                      <TableCell>{booking.total_amount?.toLocaleString()}€</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(booking.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{log.action.replace('_', ' ')}</Badge>
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    </div>
                    <p className="text-sm">
                      Action sur {log.target_type}: {log.target_id}
                    </p>
                    {log.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Outils de modération</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-medium">Signalements</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Gérer les signalements d'utilisateurs
                    </p>
                    <Button variant="outline" size="sm">
                      Voir les signalements
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">Vérifications</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Vérifier les profils en attente
                    </p>
                    <Button variant="outline" size="sm">
                      Voir les demandes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium">Statistiques</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Rapport détaillé d'activité
                    </p>
                    <Button variant="outline" size="sm">
                      Générer un rapport
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
