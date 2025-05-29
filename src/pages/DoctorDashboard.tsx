
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
import { useAuth } from '@/hooks/useAuth';
import { useRecentVacations } from '@/hooks/useRecentVacations';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="vacations" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Vacations</span>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => navigate('/create-vacation')} 
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une nouvelle vacation
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/manage-vacations')}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Gérer mes vacations
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/my-bookings')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Voir mes réservations
                  </Button>
                </CardContent>
              </Card>
              
              <RecentVacations 
                vacations={vacations}
                title="Vacations récentes"
                emptyMessage="Aucune vacation créée"
                onViewAll={() => navigate('/manage-vacations')}
                showActions={true}
                onActionClick={(vacation) => navigate(`/vacation/${vacation.id}`)}
                actionLabel="Voir détails"
              />
            </div>
          </TabsContent>

          <TabsContent value="vacations">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Mes vacations</h2>
                <Button onClick={() => navigate('/create-vacation')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle vacation
                </Button>
              </div>
              <RecentVacations 
                vacations={vacations}
                title="Toutes mes vacations"
                emptyMessage="Aucune vacation créée"
                showActions={true}
                onActionClick={(vacation) => navigate(`/vacation/${vacation.id}`)}
                actionLabel="Gérer"
              />
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Centre de messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une réservation pour voir les messages</p>
                </div>
              </CardContent>
            </Card>
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
