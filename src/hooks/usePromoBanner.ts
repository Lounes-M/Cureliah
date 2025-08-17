import { useState, useEffect } from 'react';
import { logger } from "@/services/logger";

interface UsePromoBannerOptions {
  storageKey?: string;
  autoHideDays?: number;
  showForNewUsers?: boolean;
  user?: any; // Utilisateur connecté
  intendedUserType?: 'doctor' | 'establishment' | null; // Type d'utilisateur prévu (pour inscription)
  subscriptionStatus?: "active" | "inactive" | "canceled" | "trialing" | "past_due" | null;
}

export const usePromoBanner = (options: UsePromoBannerOptions = {}) => {
  const {
    storageKey = 'cureliah_promo_banner_dismissed',
    autoHideDays = 7,
    showForNewUsers = true,
    user,
    intendedUserType,
    subscriptionStatus
  } = options;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkShouldShow = () => {
      try {
        // Ne pas afficher pour les établissements connectés
        if (user && user.user_metadata?.user_type === 'establishment') {
          return false;
        }

        // Ne pas afficher pour les médecins déjà abonnés
        if (user && user.user_metadata?.user_type === 'doctor' && subscriptionStatus === 'active') {
          return false;
        }

        // Afficher pour :
        // 1. Visiteurs non-connectés qui vont créer un compte médecin
        // 2. Médecins non-abonnés (nouveau compte ou essai expiré)
        const shouldShowForUser = !user ? 
          (intendedUserType === 'doctor') : // Visiteur qui va créer un compte médecin
          (user.user_metadata?.user_type === 'doctor' && 
           (!subscriptionStatus || subscriptionStatus !== 'active'));

        if (!shouldShowForUser) {
          return false;
        }

        // Vérifier si l'utilisateur a déjà fermé le banner
        const dismissedData = localStorage.getItem(storageKey);
        
        if (dismissedData) {
          const { dismissedAt } = JSON.parse(dismissedData);
          const dismissedDate = new Date(dismissedAt);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // Si moins de X jours depuis fermeture, ne pas afficher
          if (daysSinceDismissed < autoHideDays) {
            return false;
          }
        }

        return true;
      } catch (error) {
        logger.error('Error checking promo banner visibility:', error);
        // En cas d'erreur, afficher seulement si pas connecté
        return !user;
      }
    };

    setIsVisible(checkShouldShow());
  }, [storageKey, autoHideDays, showForNewUsers, user, intendedUserType, subscriptionStatus]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        dismissedAt: new Date().toISOString()
      }));
      setIsVisible(false);
    } catch (error) {
      logger.error('Error dismissing promo banner:', error);
      setIsVisible(false);
    }
  };

  const show = () => {
    setIsVisible(true);
  };

  const checkWasDismissed = () => {
    try {
      const dismissedData = localStorage.getItem(storageKey);
      return !!dismissedData;
    } catch (error) {
      return false;
    }
  };

  return {
    isVisible,
    dismiss,
    show,
    wasDismissed: checkWasDismissed()
  };
};
