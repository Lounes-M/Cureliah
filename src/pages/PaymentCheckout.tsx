import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PaymentButton from '@/components/PaymentButton';

export default function PaymentCheckout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vacation_bookings')
        .select('id, status, payment_status, total_amount, start_date, end_date, vacation_title')
        .eq('id', bookingId)
        .single();
      if (error || !data) {
        toast({
          title: 'Erreur',
          description: "Impossible de charger la réservation.",
          variant: 'destructive',
        });
        navigate('/bookings');
        return;
      }
      setBooking(data);
      setLoading(false);
    };
    if (bookingId) fetchBooking();
  }, [bookingId, navigate, toast]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!booking) return null;

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Paiement de la réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium text-lg">{booking.vacation_title || 'Vacance'}</div>
            <div className="text-sm text-gray-500">
              {booking.start_date && new Date(booking.start_date).toLocaleDateString('fr-FR')} — {booking.end_date && new Date(booking.end_date).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={
              booking.status === 'booked' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }>
              {booking.status === 'booked' ? 'Active' :
                booking.status === 'completed' ? 'Terminée' :
                booking.status === 'pending' ? 'En attente' :
                booking.status === 'cancelled' ? 'Annulée' :
                booking.status}
            </Badge>
            <Badge className={
              booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }>
              {booking.payment_status === 'paid' ? 'Payé' :
                booking.payment_status === 'pending' ? 'En attente paiement' :
                'Non payé'}
            </Badge>
          </div>
          <div className="text-2xl font-bold">{booking.total_amount} €</div>
          {booking.payment_status !== 'paid' ? (
            <PaymentButton bookingId={booking.id} amount={booking.total_amount} onSuccess={() => navigate('/payment-success')} />
          ) : (
            <Button disabled variant="outline">Déjà payé</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
