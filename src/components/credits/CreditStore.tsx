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

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

  const handlePurchase = async (packageId: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour acheter des crédits",
        variant: "destructive"
      });
      return;
    }

    const selectedPackage = packages.find(p => p.id === packageId);
    if (!selectedPackage) return;

    setPurchasing(packageId);

    try {
      // Créer la session Stripe Checkout
      const { sessionId } = await CreditsService.createStripeCheckoutSession(
        user.id,
        selectedPackage.credits
      );

      // Rediriger vers Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe n\'est pas chargé');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Credit purchase error:', error);
      
      // Vérifier si l'erreur est due à un bloqueur de publicité
      if (StripeErrorHandler.isBlocked(error)) {
        StripeErrorHandler.showBlockedNotification();
        toast({
          title: "Achat bloqué",
          description: StripeErrorHandler.getBlockedMessage(),
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de traiter l'achat. Veuillez réessayer.",
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
                    <strong>Urgence moyenne:</strong> 1 crédit
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Urgence élevée:</strong> 2 crédits
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Urgence critique:</strong> 3 crédits
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-medical-blue flex-shrink-0" />
                  <div>
                    <strong>Urgence extrême:</strong> 5 crédits
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
                    <strong>Mise en avant:</strong> +3 crédits
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
                    disabled={purchasing === pkg.id}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {purchasing === pkg.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Traitement...</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
