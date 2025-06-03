import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Calendar, FileText, Settings, AlertCircle } from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import EstablishmentManagement from '@/components/admin/EstablishmentManagement';
import VacationManagement from '@/components/admin/VacationManagement';
import DocumentManagement from '@/components/admin/DocumentManagement';
import SystemSettings from '@/components/admin/SystemSettings';
import Reports from '@/components/admin/Reports';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.user_type !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour au site
        </Button>
      </div>

      <AdminStats />

      <Tabs defaultValue="users" className="mt-6">
        <TabsList className="grid grid-cols-6 gap-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="establishments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Établissements
          </TabsTrigger>
          <TabsTrigger value="vacations" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Vacations
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Rapports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="establishments" className="mt-6">
          <EstablishmentManagement />
        </TabsContent>

        <TabsContent value="vacations" className="mt-6">
          <VacationManagement />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentManagement />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Reports />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 