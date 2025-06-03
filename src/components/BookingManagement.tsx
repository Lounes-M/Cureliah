import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Building2, MessageCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationBooking, VacationPost } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import PaymentButton from './PaymentButton';
import BookingTimeline from './BookingTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EstablishmentInfo {
  id: string;
  name: string;
  establishment_type: string;
  city: string;
  first_name: string;
  last_name: string;
}

interface BookingWithDetails extends VacationBooking {
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
      console.log('Fetching bookings for doctor:', user.id);
      
      let query = supabase
        .from('vacation_bookings')
        .select(`
          *,
          vacation_posts (*)
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Get establishment IDs
      const establishmentIds = bookingsData.map(booking => booking.establishment_id);
      
      // Get establishment profiles
      const { data: establishments, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('id, name, establishment_type, city')
        .in('id', establishmentIds);

      if (establishmentError) {
        console.warn('Error fetching establishment profiles:', establishmentError);
      }

      // Get user profiles
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', establishmentIds);

      if (userError) {
        console.warn('Error fetching user profiles:', userError);
      }

      // Combine the data
      const combinedBookings = bookingsData.map(booking => {
        const establishment = establishments?.find(e => e.id === booking.establishment_id);
        const user = users?.find(u => u.id === booking.establishment_id);
        
        return {
          ...booking,
          establishment_info: establishment && user ? {
            ...establishment,
            first_name: user.first_name,
            last_name: user.last_name
          } : null
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
        .from('vacation_bookings')
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
      pending: { label: 'En attente', variant: 'warning' },
      confirmed: { label: 'Confirmée', variant: 'success' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">
                      {booking.establishment_info?.name || 'Établissement inconnu'}
                    </CardTitle>
                    <CardDescription>
                      {booking.establishment_info?.establishment_type} - {booking.establishment_info?.city}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Du {format(new Date(booking.vacation_post.start_date), 'PP', { locale: fr })} au{' '}
                      {format(new Date(booking.vacation_post.end_date), 'PP', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{booking.vacation_post.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Euro className="w-4 h-4 mr-2" />
                    <span>{booking.vacation_post.hourly_rate}€/heure</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <BookingTimeline status={booking.status} />
                  <div className="flex space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        >
                          Confirmer
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                      >
                        Marquer comme terminé
                      </Button>
                    )}
                    <Button
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
