
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      // Find the booking associated with this stripe session
      const { data: booking, error } = await supabase
        .from('vacation_bookings')
        .select(`
          *,
          vacation_posts(title),
          doctor_profiles(*)
        `)
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) throw error;

      if (booking) {
        // Update payment status to completed
        await supabase
          .from('vacation_bookings')
          .update({ payment_status: 'completed' })
          .eq('id', booking.id);

        // Update stripe payment record
        await supabase
          .from('stripe_payments')
          .update({ status: 'succeeded' })
          .eq('booking_id', booking.id);

        setPaymentDetails(booking);

        toast({
          title: "Paiement réussi",
          description: "Votre paiement a été traité avec succès",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Erreur de vérification",
        description: "Impossible de vérifier le paiement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Vérification du paiement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Paiement réussi !
            </CardTitle>
            <CardDescription>
              Votre paiement a été traité avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentDetails && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Détails de la réservation
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Vacation:</strong> {paymentDetails.vacation_posts?.title}</p>
                  <p><strong>Montant payé:</strong> {paymentDetails.total_amount}€</p>
                  <p><strong>Statut:</strong> Confirmé</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-gray-600">
                Votre réservation est maintenant confirmée. Vous recevrez un email de confirmation 
                avec tous les détails.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/bookings')} className="bg-medical-blue hover:bg-medical-blue-dark">
                  Voir mes réservations
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
