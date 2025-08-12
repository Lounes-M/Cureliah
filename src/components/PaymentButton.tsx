import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import { StripeErrorHandler } from '@/utils/stripeErrorHandler';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const PaymentButton = ({ bookingId, amount, disabled = false, onSuccess, className, children }: PaymentButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { bookingId, amount }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Vérifier si l'erreur est due à un bloqueur de publicité
      if (StripeErrorHandler.isBlocked(error)) {
        StripeErrorHandler.showBlockedNotification();
        toast({
          title: "Paiement bloqué",
          description: StripeErrorHandler.getBlockedMessage(),
          variant: "destructive",
          duration: 10000
        });
      } else {
        // Erreur générique
        toast({
          title: "Erreur de paiement",
          description: "Impossible d'initier le paiement. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {children ?? (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Régler {amount}€
        </>
      )}
    </Button>
  );
};

export default PaymentButton;
