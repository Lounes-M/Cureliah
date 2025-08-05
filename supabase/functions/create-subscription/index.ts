import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

console.log('STRIPE_SECRET_KEY:', Deno.env.get("STRIPE_SECRET_KEY"));

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Remplace * par ton domaine en prod si besoin
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// Mapping métier -> Price ID Stripe
const PLAN_ID_TO_STRIPE_PRICE: Record<string, string> = {
  essentiel: "price_1RsMk8EL5OGpZLTY5HHdsRtb", // Remplace par ton vrai Price ID Stripe
  pro: "price_1RsMkOEL5OGpZLTYVa4yHAz6",            // Remplace par ton vrai Price ID Stripe
  premium: "price_1RsMlQEL5OGpZLTYAqJFgJIg"     // Remplace par ton vrai Price ID Stripe
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { userId, planId, interval } = await req.json();
    // Si le planId est un nom métier, on le mappe vers le Price ID Stripe
    const stripePriceId = PLAN_ID_TO_STRIPE_PRICE[planId] || planId;

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId, // L'ID du prix Stripe (ex: "price_123")
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      success_url: "https://cureliah.vercel.app/payment-success",
      cancel_url: "https://cureliah.vercel.app/payment-failure",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log d'erreur pour debug Supabase
    console.error("Stripe error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
