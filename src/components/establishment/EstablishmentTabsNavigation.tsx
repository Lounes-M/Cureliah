
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Users, MessageSquare, FileText, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import DocumentManager from '@/components/documents/DocumentManager';
import ReviewsRatings from '@/components/ReviewsRatings';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import EstablishmentQuickActions from './EstablishmentQuickActions';
import EstablishmentRecentBookings from './EstablishmentRecentBookings';
import { useAuth } from '@/hooks/useAuth';

interface EstablishmentTabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const EstablishmentTabsNavigation = ({ activeTab, setActiveTab }: EstablishmentTabsNavigationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>Vue d'ensemble</span>
        </TabsTrigger>
        <TabsTrigger value="search" className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <span>Recherche</span>
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
        <DashboardStats userType="establishment" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EstablishmentQuickActions />
          <EstablishmentRecentBookings />
        </div>
      </TabsContent>

      <TabsContent value="search">
        <Card>
          <CardHeader>
            <CardTitle>Recherche de vacations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/vacation-search')}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                Commencer la recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messages">
        <MessagingCenter />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentManager />
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewsRatings 
          targetId={user?.id || ''} 
          targetType="establishment" 
        />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationCenter />
      </TabsContent>
    </Tabs>
  );
};

export default EstablishmentTabsNavigation;
