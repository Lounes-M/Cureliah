import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Building2, MessageCircle, ChevronDown, ChevronUp, Filter, Clock, Phone, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import PaymentButton from './PaymentButton';
import BookingTimeline from './BookingTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Fonction de formatage des dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface EstablishmentInfo {
  id: string;
  name: string;
  establishment_type: string;
  city: string;
  first_name: string;
  last_name: string;
}

interface VacationPost {
  id: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  act_type: string;
}

interface BookingWithDetails {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  booking_date: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  contact_phone: string;
  duration_hours: number;
  created_at: string;
  establishment_id: string;
  vacation_post: VacationPost;
  establishment_info: EstablishmentInfo | null;
}

interface BookingManagementProps {
  status?: string;
}

const BookingManagement = ({ status }: BookingManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    establishmentType: 'all',
    city: '',
    status: status || 'all'
  });

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching bookings for doctor:', user.id);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          vacation_posts (
            id,
            title,
            location,
            start_date,
            end_date,
            hourly_rate,
            act_type
          )
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status !== 'all') {
        const statusList = filters.status.split(',');
        if (statusList.length > 1) {
          query = query.in('status', statusList);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (status && status !== 'all') {
        const statusList = status.split(',');
        if (statusList.length > 1) {
          query = query.in('status', statusList);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('📦 Raw bookings data:', bookingsData);

      if (!bookingsData || bookingsData.length === 0) {
        console.log('📭 No bookings found');
        setBookings([]);
        return;
      }

      console.log(`✅ Found ${bookingsData.length} bookings`);

      // Get establishment IDs
      const establishmentIds = [...new Set(bookingsData.map(booking => booking.establishment_id))];
      console.log('🏥 Establishment IDs to fetch:', establishmentIds);
      
      // Récupérer les profils d'établissements directement
      const { data: establishments, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('id, name, establishment_type, city, address, phone, email')
        .in('id', establishmentIds);

      if (establishmentError) {
        console.error('❌ Error fetching establishment profiles:', establishmentError);
        // En cas d'erreur, continuer avec des données vides plutôt que de planter
      }

      console.log('🏥 Establishment profiles found:', establishments);

      // Combine the data
      const combinedBookings = bookingsData.map(booking => {
        const establishment = establishments?.find(e => e.id === booking.establishment_id);
        
        let establishmentInfo = null;
        
        if (establishment) {
          // Cas normal : profil d'établissement trouvé
          establishmentInfo = {
            id: establishment.id,
            name: establishment.name,
            establishment_type: establishment.establishment_type,
            city: establishment.city,
            first_name: '',
            last_name: ''
          };
          console.log('✅ Found establishment:', establishment.name);
        } else {
          // Fallback : établissement non trouvé
          establishmentInfo = {
            id: booking.establishment_id,
            name: 'Établissement inconnu',
            establishment_type: 'Non spécifié',
            city: 'Non spécifié',
            first_name: '',
            last_name: ''
          };
          console.log('⚠️ Establishment not found for ID:', booking.establishment_id);
        }
        
        return {
          ...booking,
          vacation_post: booking.vacation_posts,
          establishment_info: establishmentInfo
        };
      });

      // Apply additional filters
      let filteredBookings = combinedBookings;

      if (filters.dateRange !== 'all') {
        const now = new Date();
        filteredBookings = filteredBookings.filter(booking => {
          const startDate = new Date(booking.vacation_post.start_date);
          switch (filters.dateRange) {
            case 'upcoming':
              return startDate > now;
            case 'past':
              return startDate < now;
            case 'current':
              return startDate <= now && new Date(booking.vacation_post.end_date) >= now;
            default:
              return true;
          }
        });
      }

      if (filters.establishmentType !== 'all') {
        filteredBookings = filteredBookings.filter(booking => 
          booking.establishment_info?.establishment_type === filters.establishmentType
        );
      }

      if (filters.city) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.establishment_info?.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }

      setBookings(filteredBookings);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du chargement des réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user, filters]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la réservation mis à jour"
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminée', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
      rejected: { label: 'Rejetée', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      low: { label: 'Faible', className: 'bg-green-100 text-green-700' },
      medium: { label: 'Normal', className: 'bg-orange-100 text-orange-700' },
      high: { label: 'Urgent', className: 'bg-red-100 text-red-700' }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || { label: urgency, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
          <CardDescription>Filtrer vos réservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="upcoming">À venir</SelectItem>
                <SelectItem value="current">En cours</SelectItem>
                <SelectItem value="past">Passées</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.establishmentType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, establishmentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type d'établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hospital">Hôpital</SelectItem>
                <SelectItem value="clinic">Clinique</SelectItem>
                <SelectItem value="private_practice">Cabinet privé</SelectItem>
                <SelectItem value="medical_center">Centre médical</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Ville"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            />

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.dateRange !== 'all' || filters.city || filters.establishmentType !== 'all'
                ? 'Aucune réservation ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore de réservations.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {booking.establishment_info?.name || 'Établissement inconnu'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span>{booking.establishment_info?.establishment_type} - {booking.establishment_info?.city}</span>
                        {booking.urgency && getUrgencyBadge(booking.urgency)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <p className="text-sm text-gray-500 mt-1">
                      Créée le {formatDate(booking.created_at)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informations de la vacation */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 mb-3">Détails de la vacation</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        Du {formatDateTime(booking.start_date)} 
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-green-500" />
                      <span>Durée: {booking.duration_hours}h</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-red-500" />
                      <span>{booking.vacation_post?.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Euro className="w-4 h-4 mr-2 text-yellow-500" />
                      <span className="font-medium">{booking.total_amount}€ (estimation)</span>
                    </div>
                  </div>

                  {/* Contact et actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 mb-3">Contact & Actions</h4>
                    {booking.contact_phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-purple-500" />
                        <span>{booking.contact_phone}</span>
                      </div>
                    )}
                    {booking.message && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Message:</strong> {booking.message}
                        </p>
                      </div>
                    )}
                    
                    {/* Actions selon le statut */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Marquer comme terminé
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowMessaging(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de messagerie */}
      {selectedBooking && (
        <MessagingModal
          isOpen={showMessaging}
          onClose={() => {
            setShowMessaging(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          receiverId={selectedBooking.establishment_id}
          receiverName={selectedBooking.establishment_info?.name || 'Établissement'}
          receiverType="establishment"
        />
      )}
    </div>
  );
};

export default BookingManagement;