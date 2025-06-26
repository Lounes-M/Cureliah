import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingSection from '@/components/landing/PricingSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Souscrire à un abonnement</h1>
        <PricingSection onSubscribe={handleSubscribe} loading={loading} />
      </div>
    </div>
  );
}
