import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users, MessageSquare, FileText, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import RecentVacations from '@/components/RecentVacations';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import DocumentManager from '@/components/documents/DocumentManager';
import ReviewsRatings from '@/components/ReviewsRatings';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { useAuth } from '@/hooks/useAuth';
import { useRecentVacations } from '@/hooks/useRecentVacations';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { vacations, loading } = useRecentVacations();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Veuillez vous connecter pour accéder au tableau de bord</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Médecin</h1>
          <p className="text-gray-600">Gérez vos vacations et consultez vos statistiques</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Avis</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardStats userType="doctor" />
            <RecentVacations
              vacations={vacations}
              title="Vacations récentes"
              emptyMessage="Aucune vacation trouvée"
              onViewAll={() => navigate('/doctor/manage-vacations')}
              showActions={true}
              onActionClick={(vacation) => navigate(`/doctor/vacation/${vacation.id}`)}
              actionLabel="Voir détails"
            />
          </TabsContent>

          <TabsContent value="messages">
            <MessagingCenter />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsRatings 
              targetId={user.id} 
              targetType="doctor" 
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
