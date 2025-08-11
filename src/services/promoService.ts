// Service pour gérer les promotions et codes promo Stripe
export interface PromoCode {
  id: string;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  currency?: string;
  valid_until?: string;
  max_redemptions?: number;
  times_redeemed?: number;
  active: boolean;
}

export interface StripePromoConfig {
  promo_id: string; // ID Stripe de la promotion
  code: string;
  description: string;
  discount_percent?: number;
  valid_for_plans: string[];
}

export class PromoService {
  private static instance: PromoService;
  
  // Configuration du code promo WELCOME100
  private static readonly WELCOME_PROMO: StripePromoConfig = {
    promo_id: 'promo_1RuwSNEL5OGpZLTYbh8L5YfT',
    code: 'WELCOME100',
    description: 'Premier mois gratuit pour tous les nouveaux abonnements',
    discount_percent: 100,
    valid_for_plans: ['pro', 'premium']
  };

  static getInstance(): PromoService {
    if (!PromoService.instance) {
      PromoService.instance = new PromoService();
    }
    return PromoService.instance;
  }

  /**
   * Vérifie si un code promo est valide
   */
  async validatePromoCode(code: string): Promise<{ valid: boolean; promo?: StripePromoConfig; error?: string }> {
    try {
      if (code.toUpperCase() === PromoService.WELCOME_PROMO.code) {
        return {
          valid: true,
          promo: PromoService.WELCOME_PROMO
        };
      }

      return {
        valid: false,
        error: 'Code promo invalide'
      };
    } catch (error) {
      console.error('Erreur lors de la validation du code promo:', error);
      return {
        valid: false,
        error: 'Erreur lors de la validation'
      };
    }
  }

  /**
   * Applique un code promo à une session de checkout Stripe
   */
  buildCheckoutParams(priceId: string, promoCode?: string) {
    const params: any = {
      price_id: priceId,
      success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`
    };

    // Ajouter le code promo si fourni et valide
    if (promoCode && promoCode.toUpperCase() === PromoService.WELCOME_PROMO.code) {
      params.promotion_code = PromoService.WELCOME_PROMO.promo_id;
    }

    return params;
  }

  /**
   * Récupère les informations du code promo WELCOME100
   */
  getWelcomePromo(): StripePromoConfig {
    return PromoService.WELCOME_PROMO;
  }

  /**
   * Formate la description du code promo pour l'affichage
   */
  formatPromoDescription(promo: StripePromoConfig): string {
    if (promo.discount_percent === 100) {
      return 'Premier mois gratuit';
    } else if (promo.discount_percent) {
      return `${promo.discount_percent}% de réduction`;
    }
    return promo.description;
  }

  /**
   * Track l'utilisation d'un code promo pour analytics
   */
  trackPromoUsage(code: string, context: 'banner_click' | 'checkout' | 'copied') {
    try {
      // Analytics tracking
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'promo_code_interaction', {
          promo_code: code,
          interaction_type: context,
          timestamp: new Date().toISOString()
        });
      }

      // Console log pour debug
      console.log(`Promo code ${code} used in context: ${context}`);
    } catch (error) {
      console.error('Erreur lors du tracking du code promo:', error);
    }
  }
}

// Instance singleton
export const promoService = PromoService.getInstance();
