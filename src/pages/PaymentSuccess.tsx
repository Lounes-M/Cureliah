import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import Footer from '@/components/Footer';
import { CheckCircle2, CalendarCheck2, AlertCircle, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client.browser';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSubscribed, subscriptionLoading, user } = useAuth();
  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);
  const [paymentStatus, setPaymentStatus] = useState<{
    verified: boolean;
    loading: boolean;
    error?: string;
  }>({ verified: false, loading: true });

  // Vérifier le statut du paiement avec Stripe
  React.useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    console.log('[PaymentSuccess] Effect triggered:', { 
      sessionId, 
      userId: user?.id, 
      subscriptionLoading,
      user: user ? 'loaded' : 'null'
    });
    
    if (!sessionId) {
      setPaymentStatus({ verified: false, loading: false, error: "Session ID manquant dans l'URL" });
      return;
    }
    
    // Si on est encore en train de charger l'auth OU si pas d'utilisateur
    if (subscriptionLoading) {
      // TODO: Replace with logger.info('[PaymentSuccess] Auth still loading, waiting...');
      setPaymentStatus({ verified: false, loading: true, error: null });
      return;
    }
    
    if (!user?.id) {
      // TODO: Replace with logger.info('[PaymentSuccess] No user ID available, retry in 1 second...');
      setPaymentStatus({ verified: false, loading: true, error: null });
      
      // Retry après 1 seconde si pas d'utilisateur
      setTimeout(() => {
        const currentUser = user; // Capturer la valeur actuelle
        if (currentUser?.id) {
          // TODO: Replace with logger.info('[PaymentSuccess] User loaded on retry, starting verification:', currentUser.id);
          checkPaymentStatus(sessionId, currentUser.id);
        }
      }, 1000);
      return;
    }
    
    // TODO: Replace with logger.info('[PaymentSuccess] Starting payment verification for:', { sessionId, userId: user.id });
    checkPaymentStatus(sessionId, user.id);
  }, [searchParams, user, subscriptionLoading]);

  const checkPaymentStatus = useCallback(async (sessionId: string, userId: string) => {
    setPaymentStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { sessionId, userId }
      });

      if (error) throw error;

      // TODO: Replace with logger.info('Payment status check:', data);
      
      if (data?.paymentStatus === 'paid') {
        setPaymentStatus({
          verified: true, 
          loading: false,
          error: null
        });
        
        // Force refresh de l'auth pour récupérer le nouveau statut d'abonnement
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else if (data?.paymentStatus === 'unpaid' || data?.sessionStatus === 'open') {
        setPaymentStatus({ 
          verified: false, 
          loading: false, 
          error: 'Le paiement n\'a pas encore été finalisé. La session Stripe est toujours ouverte.'
        });
        
        // Réessayer après 3 secondes si la session est encore ouverte
        setTimeout(() => {
          checkPaymentStatus(sessionId, userId);
        }, 3000);
        
      } else {
        setPaymentStatus({ 
          verified: false, 
          loading: false, 
          error: `Statut de paiement: ${data?.paymentStatus || 'inconnu'} - Session: ${data?.sessionStatus || 'inconnue'}`
        });
      }
    } catch (error) {
      // TODO: Replace with logger.error('Error checking payment status:', error);
      setPaymentStatus({ 
        verified: false, 
        loading: false, 
        error: "Erreur lors de la vérification du paiement. Veuillez réessayer."
      });
    }
  }, []);

  // Reload automatique tant que l'abonnement n'est pas actif
  React.useEffect(() => {
    if (!isSubscribed() && !subscriptionLoading) {
      const timeout = setTimeout(() => {
        window.location.reload();
      }, 2000); // 2 secondes
      return () => clearTimeout(timeout);
    }
  }, [isSubscribed, subscriptionLoading]);

  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-blue-light/30 via-white to-medical-green-light/30">
      {paymentStatus.verified && <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />}
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center text-center animate-fade-in">
          
          {/* État de chargement */}
          {paymentStatus.loading && (
            <>
              <Clock className="w-20 h-20 text-blue-500 mb-6 animate-spin" />
              <h1 className="text-3xl font-extrabold mb-3 text-blue-700 tracking-tight">Vérification en cours...</h1>
              <p className="text-gray-700 mb-8 text-lg">
                Nous vérifions le statut de votre paiement avec Stripe.
                <br />Veuillez patienter quelques instants.
              </p>
            </>
          )}

          {/* Paiement vérifié et réussi */}
          {!paymentStatus.loading && paymentStatus.verified && (
            <>
              <CheckCircle2 className="w-20 h-20 text-medical-green-light mb-6 animate-bounce-in" />
              <h1 className="text-4xl font-extrabold mb-3 text-green-700 tracking-tight drop-shadow">Paiement réussi !</h1>
              <p className="text-gray-700 mb-8 text-lg">
                Merci pour votre paiement. Votre transaction a été traitée avec succès.
                <br />Vous pouvez maintenant profiter de toutes les fonctionnalités de Cureliah.
              </p>
            </>
          )}

          {/* Erreur de paiement */}
          {!paymentStatus.loading && !paymentStatus.verified && (
            <>
              <AlertCircle className="w-20 h-20 text-orange-500 mb-6" />
              <h1 className="text-3xl font-extrabold mb-3 text-orange-700 tracking-tight">Vérification du paiement</h1>
              <p className="text-gray-700 mb-8 text-lg">
                {paymentStatus.error || "Nous vérifions encore le statut de votre paiement."}
                <br />Si le problème persiste, contactez notre support.
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition text-base"
                >
                  Vérifier à nouveau
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-base"
                >
                  Contacter le support
                </button>
              </div>
            </>
          )}

          {/* Boutons de navigation (seulement si paiement vérifié) */}
          {!paymentStatus.loading && paymentStatus.verified && (
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="px-6 py-3 bg-medical-blue text-white rounded-lg font-semibold shadow hover:bg-medical-blue-dark transition text-base flex items-center justify-center gap-2"
              >
                <CalendarCheck2 className="w-5 h-5" />
                Retour au tableau de bord
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold shadow hover:bg-medical-green transition text-base flex items-center justify-center gap-2"
              >
                Voir mes réservations
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
