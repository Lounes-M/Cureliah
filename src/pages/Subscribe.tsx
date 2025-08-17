import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingSection from '@/components/landing/PricingSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { PromoHeaderBanner } from '@/components/PromoHeaderBanner';
import { usePromoBanner } from '@/hooks/usePromoBanner';
import { useStripeBlockerDetector } from '@/hooks/useStripeBlockerDetector';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';
import { logger } from "@/services/logger";

export default function Subscribe() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Hook pour détecter les bloqueurs Stripe
  const { isBlocked, testStripeConnection } = useStripeBlockerDetector();

  // Hook pour la bannière promo
  const { isVisible: isPromoBannerVisible, dismiss: dismissPromoBanner } = usePromoBanner({
    user,
    showForNewUsers: true
  });

  // Callback pour lancer le paiement Stripe
  const handleSubscribe = async (planId: string, isYearly: boolean) => {
    // Vérifier l'accès à Stripe avant de continuer
    const stripeAccessible = await testStripeConnection();
    if (!stripeAccessible) {
      return; // Le hook affichera déjà l'avertissement
    }
    
    // Si l'utilisateur n'est pas connecté, rediriger vers signup médecin
    if (!user) {
      navigate(`/auth?type=doctor&plan=${planId}`);
      return;
    }

    setLoading(true);
    try {
      logger.info("[Subscribe] user.id utilisé pour l'abonnement:", user.id);
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          userId: user.id,
          planId,
          interval: isYearly ? 'year' : 'month',
        },
      });
      if (error || !data?.url) throw error || new Error('Erreur lors de la création de la session de paiement');
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: "Impossible de lancer le paiement d'abonnement.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Promo Header Banner fixe en haut de page pour médecins */}
      {user?.user_metadata?.user_type === 'doctor' && isPromoBannerVisible && (
        <PromoHeaderBanner 
          onClose={dismissPromoBanner}
          user={user}
        />
      )}
      
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-medical-blue-light/30 via-white to-medical-green-light/30 ${
        user?.user_metadata?.user_type === 'doctor' && isPromoBannerVisible ? 'pt-20' : ''
      }`}>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        
        {/* Avertissement bloqueur Stripe */}
        {isBlocked && (
          <Card className="mb-6 border-orange-200 bg-orange-50 max-w-4xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-orange-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Bloqueur de publicité détecté</p>
                  <p className="text-sm mt-1">
                    Stripe semble être bloqué par votre navigateur. 
                    <button 
                      onClick={() => navigate('/payment-troubleshooting')}
                      className="text-orange-600 underline ml-1 hover:text-orange-700"
                    >
                      Voir les solutions →
                    </button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="w-full">
          <PricingSection onSubscribe={handleSubscribe} loading={loading} />
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}
