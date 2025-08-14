import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mapping des Price IDs Stripe vers les plans
const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  // Plans Essentiel
  'price_1RsMk8EL5OGpZLTY5HHdsRtb': 'essentiel', // Monthly €49
  'price_1RsMk8EL5OGpZLTY7VcvYyLF': 'essentiel', // Yearly ~€39/mois
  
  // Plans Pro  
  'price_1RsMkOEL5OGpZLTYVa4yHAz6': 'pro', // Monthly €99
  'price_1RsMkzEL5OGpZLTYLYKANste': 'pro', // Yearly ~€79/mois
  
  // Plans Premium
  'price_1RsMlQEL5OGpZLTYAqJFgJIg': 'premium', // Monthly €199
  'price_1RsMlhEL5OGpZLTYBdPpEwJH': 'premium', // Yearly ~€159/mois
};

// Fonction pour déterminer le plan depuis le price_id
function getPlanFromPriceId(priceId: string): string {
  const plan = STRIPE_PRICE_TO_PLAN[priceId];
  if (plan) {
    console.log(`[check-payment-status] Mapped price_id ${priceId} to plan: ${plan}`);
    return plan;
  }
  
  console.warn(`[check-payment-status] Unknown price_id ${priceId}, defaulting to 'essentiel'`);
  return 'essentiel'; // Default fallback
}

serve(async (req) => {
  console.log("[check-payment-status] Function called");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authentification JWT Supabase
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), { 
      status: 401, headers: corsHeaders 
    });
  }

  // Récupération des variables d'environnement
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { 
      status: 500, headers: corsHeaders 
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { sessionId, userId } = await req.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), { 
        status: 400, headers: corsHeaders 
      });
    }

    console.log("[check-payment-status] Checking session:", sessionId);
    
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    console.log("[check-payment-status] Session details:", {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      customer: session.customer,
      subscription: session.subscription,
      mode: session.mode
    });

    // Vérifier le statut du paiement
    const response: any = {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      url: session.url,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      dbSynced: false
    };

    // Pour les abonnements (mode: subscription)
    if (session.mode === 'subscription') {
      // Si le paiement est réussi OU si le montant est 0 (coupon 100%)
      const isPaymentComplete = session.payment_status === 'paid' || 
                               (session.amount_total === 0 && session.status === 'complete');
                               
      console.log("[check-payment-status] Payment analysis:", {
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        status: session.status,
        isPaymentComplete
      });

      if (isPaymentComplete && session.subscription) {
        console.log("[check-payment-status] Payment completed (including 0€ coupons), checking DB sync");
        
        // Récupérer les détails de l'abonnement Stripe
        let subscription;
        if (typeof session.subscription === 'string') {
          subscription = await stripe.subscriptions.retrieve(session.subscription);
        } else {
          subscription = session.subscription; // Déjà expanded
        }
        console.log("[check-payment-status] Stripe subscription status:", subscription.status);
        
        // Extraire le price_id pour déterminer le plan
        const priceId = subscription.items.data[0]?.price?.id;
        console.log("[check-payment-status] Price ID from subscription:", priceId);
        
        // Déterminer l'utilisateur (depuis les params ou metadata de session)
        const targetUserId = userId || session.metadata?.userId;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
        
        console.log("[check-payment-status] DB Sync attempt:", { 
          targetUserId, 
          subscriptionId, 
          customerId, 
          hasUserId: !!targetUserId 
        });
        
        if (targetUserId) {
          console.log("[check-payment-status] Checking for existing subscription for user:", targetUserId);
          
          // Vérifier si l'abonnement est déjà en base
          const { data: existingSubs, error: selectError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", targetUserId)
            .eq("stripe_subscription_id", subscriptionId);

          if (selectError) {
            console.error("[check-payment-status] Error checking existing subscription:", selectError);
            console.log("[check-payment-status] DB sync failed due to select error");
          }

          const existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;

          if (!existingSub) {
            console.log("[check-payment-status] Subscription not in DB, creating...");
            
            // Déterminer le plan depuis le price_id
            const planType = getPlanFromPriceId(priceId);
            
            const subscriptionData = {
              user_id: targetUserId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              plan_type: planType,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log("[check-payment-status] Inserting subscription data:", subscriptionData);
            
            // Créer l'abonnement en base
            const { data: insertResult, error: insertError } = await supabase
              .from("user_subscriptions")
              .upsert(subscriptionData)
              .select();

            if (insertError) {
              console.error("[check-payment-status] Error creating subscription:", insertError);
            } else {
              console.log("[check-payment-status] Subscription created successfully:", insertResult);
              response.dbSynced = true;
            }
          } else {
            console.log("[check-payment-status] Subscription already exists in DB, updating with latest data...");
            
            // Déterminer le plan depuis le price_id pour l'abonnement existant aussi
            const planType = getPlanFromPriceId(priceId);
            
            const { data: updateResult, error: updateError } = await supabase
              .from("user_subscriptions")
              .update({
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                plan_type: planType,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", targetUserId)
              .eq("stripe_subscription_id", subscriptionId)
              .select();

            if (updateError) {
              console.error("[check-payment-status] Error updating subscription:", updateError);
            } else {
              console.log("[check-payment-status] Subscription updated successfully:", updateResult);
            }
            
            response.dbSynced = true;
          }
        } else {
          console.error("[check-payment-status] No userId found - userId param:", userId, "session metadata userId:", session.metadata?.userId);
        }
      }
    }

    return new Response(JSON.stringify(response), { 
      status: 200, headers: corsHeaders 
    });

  } catch (error) {
    console.error("[check-payment-status] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), { 
      status: 500, headers: corsHeaders 
    });
  }
});
