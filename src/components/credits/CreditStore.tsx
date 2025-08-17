import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, Star, Zap, Package, ArrowRight, Sparkles } from 'lucide-react';
import { CreditsService } from '@/services/creditsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { StripeErrorHandler } from '@/utils/stripeErrorHandler';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CreditStoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete?: (newBalance: number) => void;
}

export const CreditStore: React.FC<CreditStoreProps> = ({
  open,
  onOpenChange,
  onPurchaseComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  const packages = CreditsService.getCreditPackages();

  // Vérifier que Stripe est configuré
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isStripeConfigured = stripeKey && stripeKey.length > 0;

  const handlePurchase = async (packageId: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour acheter des crédits",
        variant: "destructive"
      });
      return;
    }

    if (!isStripeConfigured) {
      toast({
        title: "Configuration manquante",
        description: "Le système de paiement n'est pas configuré. Contactez le support.",
        variant: "destructive"
      });
      return;
    }

    const selectedPackage = packages.find(p => p.id === packageId);
    if (!selectedPackage) return;

    setPurchasing(packageId);

    try {
      // Vérifier d'abord si Stripe est accessible
      if (!stripePromise) {
        throw new Error('STRIPE_BLOCKED');
      }

      // Créer la session Stripe Checkout avec le nouveau packageId
      const { sessionId } = await CreditsService.createStripeCheckoutSession(
        user.id,
        packageId
      );

      // Rediriger vers Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('STRIPE_BLOCKED');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }

    } catch (error: any) {
      logger.error('Credit purchase error:', error);
      
      // Vérifier si l'erreur est due à un bloqueur de publicité
      if (StripeErrorHandler.isBlocked(error) || error?.message === 'STRIPE_BLOCKED') {
        StripeErrorHandler.showBlockedNotification();
        toast({
          title: "Paiement bloqué par votre navigateur",
          description: "Veuillez désactiver votre bloqueur de publicité pour Stripe, ou contactez le support pour un paiement alternatif.",
          variant: "destructive",
          duration: 15000
        });
      } else {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de traiter l'achat. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter': return <Package className="w-6 h-6" />;
      case 'professional': return <Zap className="w-6 h-6" />;
      case 'enterprise': return <Star className="w-6 h-6" />;
      case 'premium': return <Sparkles className="w-6 h-6" />;
      default: return <Package className="w-6 h-6" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-medical-blue" />
            Boutique de Crédits
          </DialogTitle>
          <DialogDescription>
            Achetez des crédits pour publier vos demandes urgentes. 1 crédit = 1€
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations sur l'utilisation des crédits */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Comment fonctionnent les crédits ?</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Demande urgente:</strong> 5 crédits
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Boost prioritaire:</strong> +2 crédits
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Mise en vedette:</strong> +4 crédits
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Crédits permanents:</strong> Pas d'expiration
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Facturation instantanée:</strong> Utilisez immédiatement
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Support premium:</strong> Assistance prioritaire
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages de crédits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  pkg.popular ? 'border-blue-500 shadow-md' : 'hover:border-blue-300'
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-medical-blue whitespace-nowrap">
                    <Star className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="flex justify-center mb-2 text-medical-blue">
                    {getPackageIcon(pkg.id)}
                  </div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm px-2">{pkg.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center space-y-4 px-4 pb-4">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-medical-blue">
                      {pkg.credits}
                    </div>
                    <div className="text-sm text-muted-foreground">crédits</div>
                    
                    <div className="text-2xl font-semibold">
                      {pkg.price}€
                    </div>
                    
                    {pkg.savings && (
                      <div className="text-sm text-medical-green font-medium">
                        Économisez {pkg.savings}€
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs text-muted-foreground">
                    {(pkg.price / pkg.credits).toFixed(2)}€ par crédit
                  </div>
                  
                  <Button 
                    className="w-full h-10"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id || !isStripeConfigured}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {purchasing === pkg.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Traitement...</span>
                      </div>
                    ) : !isStripeConfigured ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Configuration manquante</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Acheter</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sécurité et garanties */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Paiement sécurisé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-medical-green" />
                  <span>Paiement 100% sécurisé avec Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-medical-green" />
                  <span>Crédits ajoutés instantanément</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-medical-green" />
                  <span>Support client 24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information bloqueur de publicité */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                ⚠️ Problème de paiement ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-yellow-700 text-sm space-y-2">
                <p>
                  Si le paiement ne fonctionne pas, cela peut être dû à un bloqueur de publicité qui bloque Stripe.
                </p>
                <div className="font-medium">Solutions :</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Désactivez temporairement votre bloqueur de publicité</li>
                  <li>Ajoutez *.stripe.com à votre liste blanche</li>
                  <li>Utilisez un autre navigateur (Chrome/Firefox)</li>
                  <li>Contactez notre support pour un paiement alternatif</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
