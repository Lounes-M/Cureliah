import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName, lastName } = await req.json();
    
    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialisation des clients
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    // Créer le customer Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      metadata: {
        supabase_user_id: userId,
      }
    });

    console.log(`[create-customer] Customer Stripe créé: ${customer.id} pour user: ${userId}`);

    // Enregistrer dans la base de données avec un statut "no_subscription"
    const { error: dbError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: `temp_${userId}`, // Temporaire jusqu'à souscription réelle
        status: "no_subscription",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        plan_type: "free"
      });

    if (dbError) {
      console.error("Erreur DB:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error", details: dbError.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer_id: customer.id,
        message: "Customer Stripe créé avec succès" 
      }), 
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
