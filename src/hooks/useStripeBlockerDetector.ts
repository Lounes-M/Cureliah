import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

export const useStripeBlockerDetector = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkStripeAccess = async (): Promise<boolean> => {
    if (isChecking) return !isBlocked;
    
    setIsChecking(true);
    try {
      // Test simple d'accès à Stripe
      const response = await fetch('https://js.stripe.com/v3/', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      setIsBlocked(false);
      return true;
    } catch (error: any) {
      logger.warn('Stripe access check failed:', error);
      
      // Vérifier les indicateurs d'erreur de bloqueur
      const errorString = error.toString().toLowerCase();
      const blocked = (
        errorString.includes('blocked') ||
        errorString.includes('network error') ||
        errorString.includes('failed to fetch')
      );
      
      setIsBlocked(blocked);
      return !blocked;
    } finally {
      setIsChecking(false);
    }
  };

  const showBlockerWarning = () => {
    toast({
      title: "⚠️ Bloqueur détecté",
      description: "Stripe semble être bloqué. Cliquez pour voir les solutions.",
      variant: "destructive",
      duration: 8000,
      onClick: () => navigate('/payment-troubleshooting')
    });
  };

  const testStripeConnection = async () => {
    const isAccessible = await checkStripeAccess();
    
    if (!isAccessible) {
      showBlockerWarning();
    }
    
    return isAccessible;
  };

  // Vérification automatique au montage du composant
  useEffect(() => {
    // Délai pour éviter les vérifications trop fréquentes
    const timer = setTimeout(() => {
      checkStripeAccess();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    isBlocked,
    isChecking,
    testStripeConnection,
    checkStripeAccess,
    showBlockerWarning
  };
};
