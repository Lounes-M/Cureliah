import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import Footer from '@/components/Footer';

const SubscriptionManagement: React.FC = () => {
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-customer-portal', {
        body: { userId: user?.id },
      });
      if (error || !data?.url) throw error || new Error('Erreur lors de la création du portail client');
      window.open(data.url, '_blank');
    } catch (err) {
      toast({
        title: 'Erreur',
        description: "Impossible d'accéder au portail de gestion d'abonnement.",
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
          Gérer mon abonnement
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Consultez, modifiez ou annulez votre abonnement en toute autonomie via le portail sécurisé Stripe. Retrouvez ici toutes les informations liées à votre facturation.
        </p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl py-10">
          <div className="mb-6 text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium">
              Statut : {subscriptionLoading ? 'Chargement...' : subscriptionStatus === 'active' ? 'Actif' : subscriptionStatus === 'trialing' ? 'Période d\'essai' : subscriptionStatus === 'past_due' ? 'Paiement en retard' : subscriptionStatus === 'canceled' ? 'Annulé' : 'Inactif'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button onClick={handleOpenPortal} disabled={loading || subscriptionLoading} className="w-full max-w-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Gérer mon abonnement (Stripe)
            </Button>
            <p className="text-gray-500 text-sm text-center max-w-md">
              Vous pouvez mettre à jour votre carte, consulter vos factures ou annuler votre abonnement à tout moment via le portail sécurisé Stripe.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionManagement;
