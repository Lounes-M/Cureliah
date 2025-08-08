import { supabase } from '@/integrations/supabase/client.browser';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  description: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCredits {
  user_id: string;
  balance: number;
  total_purchased: number;
  total_spent: number;
  last_updated: string;
}

export class CreditsService {
  static async getUserCredits(userId: string): Promise<UserCredits> {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      // Créer un enregistrement de crédits si il n'existe pas
      const newCredits = {
        user_id: userId,
        balance: 0,
        total_purchased: 0,
        total_spent: 0
      };

      const { data: created, error: createError } = await supabase
        .from('user_credits')
        .insert(newCredits)
        .select('*')
        .single();

      if (createError) {
        // Si l'erreur est une violation de contrainte (utilisateur déjà existant), 
        // c'est probablement une condition de course, essayons de récupérer l'enregistrement
        if (createError.code === '23505') {
          const { data: existing, error: fetchError } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (fetchError) throw fetchError;
          return existing;
        }
        throw createError;
      }
      return created;
    }

    return data;
  }

  static async getCreditTransactions(userId: string, limit = 10, offset = 0): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  static async purchaseCredits(userId: string, amount: number, paymentIntentId: string): Promise<UserCredits> {
    const { data, error } = await supabase.rpc('purchase_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_payment_intent_id: paymentIntentId,
      p_description: `Achat de ${amount} crédits`
    });

    if (error) throw error;
    return data;
  }

  static async consumeCredits(userId: string, amount: number, description: string): Promise<UserCredits> {
    const { data, error } = await supabase.rpc('consume_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    });

    if (error) throw error;
    return data;
  }

  static async createStripeCheckoutSession(userId: string, creditAmount: number): Promise<{ sessionId: string }> {
    const { data, error } = await supabase.functions.invoke('create-credits-checkout', {
      body: {
        userId,
        creditAmount,
        pricePerCredit: 1, // 1€ par crédit
        returnUrl: `${window.location.origin}/credits/success`,
        cancelUrl: `${window.location.origin}/credits/cancel`
      }
    });

    if (error) throw error;
    return data;
  }

  static async verifyPurchase(sessionId: string): Promise<{ success: boolean; credits?: UserCredits }> {
    const { data, error } = await supabase.functions.invoke('verify-credits-purchase', {
      body: { sessionId }
    });

    if (error) throw error;
    return data;
  }

  // Packages prédéfinis de crédits
  static getCreditPackages() {
    return [
      {
        id: 'starter',
        name: 'Pack Starter',
        credits: 10,
        price: 10,
        description: 'Parfait pour commencer',
        popular: false
      },
      {
        id: 'professional',
        name: 'Pack Professionnel',
        credits: 50,
        price: 45, // 10% de réduction
        description: 'Pour les établissements actifs',
        popular: true,
        savings: 5
      },
      {
        id: 'enterprise',
        name: 'Pack Entreprise',
        credits: 100,
        price: 85, // 15% de réduction
        description: 'Pour les grands établissements',
        popular: false,
        savings: 15
      },
      {
        id: 'premium',
        name: 'Pack Premium',
        credits: 200,
        price: 160, // 20% de réduction
        description: 'Maximum d\'économies',
        popular: false,
        savings: 40
      }
    ];
  }

  static calculateUrgentRequestCost(urgencyLevel: string, priorityBoost: boolean, featured: boolean): number {
    let baseCost = 1;

    // Coût selon le niveau d'urgence
    switch (urgencyLevel) {
      case 'medium':
        baseCost = 1;
        break;
      case 'high':
        baseCost = 2;
        break;
      case 'critical':
        baseCost = 3;
        break;
      case 'emergency':
        baseCost = 5;
        break;
    }

    // Options supplémentaires
    if (priorityBoost) baseCost += 2;
    if (featured) baseCost += 3;

    return baseCost;
  }
}
