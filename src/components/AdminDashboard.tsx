
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  FileText, 
  Activity,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalEstablishments: number;
  totalBookings: number;
  pendingVerifications: number;
}

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  created_at: string;
  doctor_profile?: any;
  establishment_profile?: any;
}

interface AdminLog {
  id: string;
  action: string;
  target_type: string;
  created_at: string;
  details: any;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalEstablishments: 0,
    totalBookings: 0,
    pendingVerifications: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .single();

      if (!adminRole) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions d'administrateur",
          variant: "destructive"
        });
        return;
      }

      fetchDashboardData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les permissions",
        variant: "destructive"
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [profilesData, bookingsData] = await Promise.all([
        supabase.from('profiles').select('user_type'),
        supabase.from('vacation_bookings').select('id')
      ]);

      const totalUsers = profilesData.data?.length || 0;
      const totalDoctors = profilesData.data?.filter(p => p.user_type === 'doctor').length || 0;
      const totalEstablishments = profilesData.data?.filter(p => p.user_type === 'establishment').length || 0;
      const totalBookings = bookingsData.data?.length || 0;

      setStats({
        totalUsers,
        totalDoctors,
        totalEstablishments,
        totalBookings,
        pendingVerifications: 0 // TODO: Implement verification logic
      });

      // Fetch users with profiles
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(*),
          establishment_profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setUsers(usersData || []);

      // Fetch admin logs
      const { data: logsData } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setLogs(logsData || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (action: string, targetType: string, targetId?: string, details?: any) => {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: user?.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Chargement du tableau d'administration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Shield className="w-8 h-8" />
          <span>Administration</span>
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médecins</CardTitle>
            <Users className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-blue">{stats.totalDoctors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Établissements</CardTitle>
            <Users className="h-4 w-4 text-medical-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-green">{stats.totalEstablishments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vérifications</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Gérer les comptes utilisateurs et leurs permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher par nom ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type d'utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="doctor">Médecins</SelectItem>
                    <SelectItem value="establishment">Établissements</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name} {!user.first_name && !user.last_name && 'Utilisateur sans nom'}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                      <Badge variant={user.user_type === 'doctor' ? 'default' : 'secondary'}>
                        {user.user_type === 'doctor' ? 'Médecin' : 'Établissement'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'activité</CardTitle>
              <CardDescription>
                Actions récentes des administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-gray-600">
                          Type: {log.target_type}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports et statistiques</CardTitle>
              <CardDescription>
                Analyses et métriques de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Section rapports en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
