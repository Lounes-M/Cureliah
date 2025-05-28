
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, User, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationBooking, VacationPost, Profile, EstablishmentProfile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import BookingStatusWorkflow from './BookingStatusWorkflow';
import BookingTimeline from './BookingTimeline';

interface BookingWithDetails extends VacationBooking {
  vacation_post: VacationPost;
  establishment_profile: Profile & { establishment_profile: EstablishmentProfile };
}

const BookingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [messagingModal, setMessagingModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    receiverId: string;
    receiverName: string;
    receiverType: 'doctor' | 'establishment';
  }>({
    isOpen: false,
    bookingId: '',
    receiverId: '',
    receiverName: '',
    receiverType: 'establishment'
  });

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_bookings')
        .select(`
          *,
          vacation_post:vacation_posts(*),
          establishment_profile:profiles!vacation_bookings_establishment_id_fkey(
            *,
            establishment_profile:establishment_profiles(*)
          )
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data as BookingWithDetails[] || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'booked': return 'Confirmée';
      case 'cancelled': return 'Annulée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string | null) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'failed': return 'Échec';
      default: return 'Non payé';
    }
  };

  const openMessaging = (booking: BookingWithDetails) => {
    setMessagingModal({
      isOpen: true,
      bookingId: booking.id,
      receiverId: booking.establishment_id,
      receiverName: booking.establishment_profile?.establishment_profile?.name || 'Établissement',
      receiverType: 'establishment'
    });
  };

  const closeMessaging = () => {
    setMessagingModal(prev => ({ ...prev, isOpen: false }));
  };

  const toggleExpanded = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des réservations...</div>;
  }

  const groupedBookings = {
    pending: bookings.filter(b => b.status === 'pending'),
    active: bookings.filter(b => b.status === 'booked'),
    completed: bookings.filter(b => b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'cancelled')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-yellow-50">
            {groupedBookings.pending.length} en attente
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {groupedBookings.active.length} actives
          </Badge>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune réservation
            </h3>
            <p className="text-gray-600">
              Les demandes de réservation apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Priority: Pending bookings first */}
          {groupedBookings.pending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center">
                <Badge className="bg-yellow-100 text-yellow-800 mr-2">
                  {groupedBookings.pending.length}
                </Badge>
                Demandes en attente
              </h3>
              <div className="grid gap-4">
                {groupedBookings.pending.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isExpanded={expandedBooking === booking.id}
                    onToggleExpanded={() => toggleExpanded(booking.id)}
                    onOpenMessaging={() => openMessaging(booking)}
                    onStatusUpdate={fetchBookings}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getPaymentStatusColor={getPaymentStatusColor}
                    getPaymentStatusText={getPaymentStatusText}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active bookings */}
          {groupedBookings.active.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                <Badge className="bg-green-100 text-green-800 mr-2">
                  {groupedBookings.active.length}
                </Badge>
                Réservations confirmées
              </h3>
              <div className="grid gap-4">
                {groupedBookings.active.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isExpanded={expandedBooking === booking.id}
                    onToggleExpanded={() => toggleExpanded(booking.id)}
                    onOpenMessaging={() => openMessaging(booking)}
                    onStatusUpdate={fetchBookings}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getPaymentStatusColor={getPaymentStatusColor}
                    getPaymentStatusText={getPaymentStatusText}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed and cancelled bookings */}
          {(groupedBookings.completed.length > 0 || groupedBookings.cancelled.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Historique</h3>
              <div className="grid gap-4">
                {[...groupedBookings.completed, ...groupedBookings.cancelled].map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isExpanded={expandedBooking === booking.id}
                    onToggleExpanded={() => toggleExpanded(booking.id)}
                    onOpenMessaging={() => openMessaging(booking)}
                    onStatusUpdate={fetchBookings}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getPaymentStatusColor={getPaymentStatusColor}
                    getPaymentStatusText={getPaymentStatusText}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={closeMessaging}
        bookingId={messagingModal.bookingId}
        receiverId={messagingModal.receiverId}
        receiverName={messagingModal.receiverName}
        receiverType={messagingModal.receiverType}
      />
    </div>
  );
};

interface BookingCardProps {
  booking: BookingWithDetails;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenMessaging: () => void;
  onStatusUpdate: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getPaymentStatusColor: (status: string | null) => string;
  getPaymentStatusText: (status: string | null) => string;
}

const BookingCard = ({
  booking,
  isExpanded,
  onToggleExpanded,
  onOpenMessaging,
  onStatusUpdate,
  getStatusColor,
  getStatusText,
  getPaymentStatusColor,
  getPaymentStatusText
}: BookingCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{booking.vacation_post.title}</CardTitle>
            <CardDescription className="mt-1">
              Demande de {booking.establishment_profile?.establishment_profile?.name || 'Établissement'}
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            <Badge className={getPaymentStatusColor(booking.payment_status)}>
              Paiement: {getPaymentStatusText(booking.payment_status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {new Date(booking.vacation_post.start_date).toLocaleDateString('fr-FR')} - 
                {new Date(booking.vacation_post.end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span>{booking.vacation_post.location || 'Non spécifié'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Euro className="w-4 h-4 text-gray-400 mr-2" />
              <span>{booking.vacation_post.hourly_rate}€/h</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {booking.establishment_profile?.establishment_profile?.establishment_type || 'Type non spécifié'}
              </span>
            </div>
            {booking.total_amount && (
              <div className="flex items-center text-sm font-medium">
                <Euro className="w-4 h-4 text-gray-400 mr-2" />
                <span>Total estimé: {booking.total_amount}€</span>
              </div>
            )}
          </div>
        </div>

        {booking.message && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              <strong>Message:</strong> {booking.message}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onOpenMessaging}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded}>
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Détails
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BookingStatusWorkflow
                bookingId={booking.id}
                currentStatus={booking.status as any}
                userType="doctor"
                partnerId={booking.establishment_id}
                partnerName={booking.establishment_profile?.establishment_profile?.name || 'Établissement'}
                onStatusUpdate={onStatusUpdate}
              />
              <BookingTimeline
                currentStatus={booking.status as any}
                createdAt={booking.created_at}
                updatedAt={booking.updated_at}
                userType="doctor"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingManagement;
