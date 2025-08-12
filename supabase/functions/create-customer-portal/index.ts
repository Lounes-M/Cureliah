import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  console.log("[create-customer-portal] Function called");
  if (req.method === "OPTIONS") {
    console.log("[create-customer-portal] OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  // Authentification JWT Supabase
  const authHeader = req.headers.get("authorization");
  console.log("[create-customer-portal] Authorization header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[create-customer-portal] Missing or invalid authorization header");
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), { status: 401, headers: corsHeaders });
  }
  const jwt = authHeader.replace("Bearer ", "");

  // Récupération des variables d'environnement
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_PORTAL_RETURN_URL = Deno.env.get("STRIPE_PORTAL_RETURN_URL") || `${Deno.env.get("APP_BASE_URL") || "https://cureliah.com"}/dashboard`;
  console.log("[create-customer-portal] Env SUPABASE_URL:", SUPABASE_URL);
  console.log("[create-customer-portal] Env SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING");
  console.log("[create-customer-portal] Env STRIPE_SECRET_KEY:", STRIPE_SECRET_KEY ? "OK" : "MISSING");
  console.log("[create-customer-portal] Env STRIPE_PORTAL_RETURN_URL:", STRIPE_PORTAL_RETURN_URL);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
    console.log("[create-customer-portal] Missing env vars");
    return new Response(JSON.stringify({ error: "Missing env vars" }), { status: 500, headers: corsHeaders });
  }

  // Décoder le JWT pour obtenir l'user id
  let userId;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userId = payload.sub;
    console.log("[create-customer-portal] Decoded userId:", userId);
  } catch (e) {
    console.log("[create-customer-portal] Invalid JWT", e);
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401, headers: corsHeaders });
  }

  // Créer un client Supabase avec le service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Récupérer le stripe_customer_id depuis la table user_subscriptions
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  console.log("[create-customer-portal] Subscription query result:", subscription, subError);

  if (subError || !subscription?.stripe_customer_id) {
    console.log("[create-customer-portal] No Stripe customer found");
    return new Response(JSON.stringify({ error: "No Stripe customer found" }), { status: 404, headers: corsHeaders });
  }

  // Créer la session de portail Stripe
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  try {
    console.log("[create-customer-portal] Creating portal session for customer:", subscription.stripe_customer_id);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: STRIPE_PORTAL_RETURN_URL,
    });
    console.log("[create-customer-portal] Portal session created:", portalSession.url);
    return new Response(JSON.stringify({ url: portalSession.url }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.log("[create-customer-portal] Stripe portal error", err);
    return new Response(JSON.stringify({ error: "Stripe portal error", details: err.message }), { status: 500, headers: corsHeaders });
  }
});
