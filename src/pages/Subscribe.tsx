import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingSection from '@/components/landing/PricingSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import Footer from '@/components/Footer';

export default function Subscribe() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Callback pour lancer le paiement Stripe
  const handleSubscribe = async (planId: string, isYearly: boolean) => {
    setLoading(true);
    try {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-blue-light/30 via-white to-medical-green-light/30">
      <header className="py-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-medical-green mb-4 drop-shadow-sm tracking-tight">
          Souscrire à un abonnement
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Choisissez l'offre qui correspond à vos besoins professionnels et accédez à toutes les fonctionnalités de la plateforme.
        </p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full">
          <PricingSection onSubscribe={handleSubscribe} loading={loading} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
