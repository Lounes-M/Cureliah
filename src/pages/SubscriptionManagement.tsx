import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';

const SubscriptionManagement: React.FC = () => {
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      // Vérifier le token d'authentification
      const session = await supabase.auth.getSession();
      
      if (!session.data.session?.access_token) {
        throw new Error('No access token available');
      }
      
      // Appeler la fonction Edge pour créer le portail
      const { data, error } = await supabase.functions.invoke('create-customer-portal');
      
      if (error) {
        console.error('Portal creation error:', error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('No portal URL returned');
      }
      
      // Ouvrir le portail Stripe dans un nouvel onglet
      window.open(data.url, '_blank');
      
    } catch (err) {
      console.error('Portal error:', err);
      toast({
        title: 'Erreur',
        description: `Impossible d'accéder au portail: ${err?.message || 'Erreur inconnue'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <CreditCard className="w-6 h-6 text-medical-blue" />
            Gérer mon abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
