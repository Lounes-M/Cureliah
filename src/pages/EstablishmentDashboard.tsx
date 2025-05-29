
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Users, MessageSquare, FileText, Star, Euro, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import DocumentManager from '@/components/documents/DocumentManager';
import ReviewsRatings from '@/components/ReviewsRatings';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { useAuth } from '@/hooks/useAuth';
import { useRecentBookings } from '@/hooks/useRecentBookings';

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { bookings, loading } = useRecentBookings();
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

  // Check if user is establishment
  if (profile && profile.user_type !== 'establishment') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Accès réservé aux établissements</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Établissement</h1>
          <p className="text-gray-600">Trouvez des médecins et gérez vos réservations</p>
        </div>

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
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => navigate('/vacation-search')} 
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher des vacations
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/my-bookings')}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Mes réservations
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/establishment-search')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Rechercher des médecins
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Réservations récentes</CardTitle>
                    <p className="text-sm text-gray-600">
                      {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  {bookings.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/my-bookings')}>
                      Voir tout
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      Chargement...
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune réservation récente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium truncate">{booking.vacation_post?.title}</h4>
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusText(booking.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(booking.vacation_post?.start_date).toLocaleDateString('fr-FR')}
                              </div>
                              <div className="flex items-center">
                                <Euro className="w-3 h-3 mr-1" />
                                {booking.total_amount}€
                              </div>
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-xs">
                                  {booking.vacation_post?.speciality}
                                </Badge>
                              </div>
                              {booking.vacation_post?.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span className="truncate">{booking.vacation_post?.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
              targetId={user.id} 
              targetType="establishment" 
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

export default EstablishmentDashboard;
