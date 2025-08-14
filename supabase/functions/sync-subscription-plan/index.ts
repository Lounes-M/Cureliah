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

function getPlanFromPriceId(priceId: string): string {
  const plan = STRIPE_PRICE_TO_PLAN[priceId];
  if (plan) {
    console.log(`[sync-subscription-plan] Mapped price_id ${priceId} to plan: ${plan}`);
    return plan;
  }
  
  console.warn(`[sync-subscription-plan] Unknown price_id ${priceId}, defaulting to 'essentiel'`);
  return 'essentiel'; // Default fallback
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const jwt = authHeader.replace("Bearer ", "");
  let userId;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userId = payload.sub;
    console.log("[sync-subscription-plan] userId:", userId);
  } catch (e) {
    console.error("[sync-subscription-plan] Invalid JWT:", e);
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Récupérer l'abonnement actuel de l'utilisateur
    const { data: currentSub, error: selectError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (selectError || !currentSub) {
      console.error("[sync-subscription-plan] No subscription found:", selectError);
      return new Response(JSON.stringify({ error: "No subscription found" }), { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log("[sync-subscription-plan] Current subscription:", currentSub);

    // Récupérer l'abonnement depuis Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
    console.log("[sync-subscription-plan] Stripe subscription status:", stripeSubscription.status);

    // Extraire le price_id
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    console.log("[sync-subscription-plan] Price ID from Stripe:", priceId);

    if (!priceId) {
      return new Response(JSON.stringify({ error: "No price ID found in Stripe subscription" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Déterminer le plan depuis le price_id
    const planType = getPlanFromPriceId(priceId);

    // Mettre à jour l'abonnement avec le bon plan
    const { data: updatedSub, error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        plan_type: planType,
        status: stripeSubscription.status,
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("[sync-subscription-plan] Error updating subscription:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log("[sync-subscription-plan] Subscription updated successfully:", updatedSub);

    return new Response(JSON.stringify({ 
      success: true, 
      oldPlan: currentSub.plan_type,
      newPlan: planType,
      priceId: priceId,
      subscription: updatedSub 
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("[sync-subscription-plan] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
