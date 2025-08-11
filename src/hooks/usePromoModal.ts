import { useState, useEffect } from 'react';

interface UsePromoModalOptions {
  user?: any;
  trigger?: 'signup_hesitation' | 'checkout_abandon' | 'manual';
  delay?: number;
}

export const usePromoModal = (options: UsePromoModalOptions = {}) => {
  const { user, trigger = 'manual', delay = 0 } = options;
  const [isOpen, setIsOpen] = useState(false);

  // Auto-show pour certains triggers
  useEffect(() => {
    if (trigger === 'signup_hesitation') {
      // Afficher après un délai si l'utilisateur hésite sur la page d'inscription
      const timer = setTimeout(() => {
        // Ne montrer que si pas d'utilisateur connecté et pas déjà fermé récemment
        const recentlyDismissed = localStorage.getItem('promo_modal_dismissed_recent');
        if (!user && !recentlyDismissed) {
          setIsOpen(true);
        }
      }, delay || 10000); // 10 secondes par défaut

      return () => clearTimeout(timer);
    }
  }, [user, trigger, delay]);

  const show = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    
    // Mémoriser la fermeture pour éviter de re-afficher trop souvent
    if (trigger !== 'manual') {
      localStorage.setItem('promo_modal_dismissed_recent', Date.now().toString());
      
      // Auto-clear après 1 heure
      setTimeout(() => {
        localStorage.removeItem('promo_modal_dismissed_recent');
      }, 60 * 60 * 1000);
    }
  };

  return {
    isOpen,
    show,
    close
  };
};
