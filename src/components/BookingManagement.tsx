
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, User, Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VacationBooking, VacationPost, Profile, EstablishmentProfile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import PaymentButton from './PaymentButton';

interface BookingWithDetails extends VacationBooking {
  vacation_post: VacationPost;
  establishment_profile: Profile & { establishment_profile: EstablishmentProfile };
}

const BookingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
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

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: status as any }
            : booking
        )
      );

      toast({
        title: "Succès",
        description: `Réservation ${status === 'booked' ? 'acceptée' : 'refusée'} avec succès`,
      });
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la réservation",
        variant: "destructive"
      });
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
      case 'booked': return 'Acceptée';
      case 'cancelled': return 'Refusée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <div className="text-center py-8">Chargement des réservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h2>
        <Badge variant="outline">
          {bookings.filter(b => b.status === 'pending').length} en attente
        </Badge>
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
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.vacation_post.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Demande de {booking.establishment_profile?.establishment_profile?.name || 'Établissement'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                    {booking.payment_status && (
                      <Badge className={getPaymentStatusColor(booking.payment_status)}>
                        Paiement: {booking.payment_status}
                      </Badge>
                    )}
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

                {booking.status === 'pending' && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => updateBookingStatus(booking.id, 'booked')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Refuser
                    </Button>
                    <Button variant="outline" onClick={() => openMessaging(booking)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}

                {booking.status === 'booked' && (
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => openMessaging(booking)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contacter l'établissement
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                    >
                      Marquer comme terminé
                    </Button>
                  </div>
                )}

                {(booking.status === 'cancelled' || booking.status === 'completed') && (
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => openMessaging(booking)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Voir les messages
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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

export default BookingManagement;
