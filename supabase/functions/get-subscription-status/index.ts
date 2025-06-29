import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Définir les headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Gérer la requête préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Log header Authorization
  const authHeader = req.headers.get("authorization");
  console.log("[get-subscription-status] Authorization header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[get-subscription-status] Missing or invalid authorization header");
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), { status: 401, headers: corsHeaders });
  }
  const jwt = authHeader.replace("Bearer ", "");

  // Récupération des variables d'environnement
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log("[get-subscription-status] Missing Supabase env vars");
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500, headers: corsHeaders });
  }

  // Décoder le JWT pour obtenir l'user id
  let userId;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userId = payload.sub;
    console.log("[get-subscription-status] Decoded userId:", userId);
  } catch (e) {
    console.log("[get-subscription-status] Invalid JWT", e);
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401, headers: corsHeaders });
  }

  // Créer un client Supabase avec le service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Lire la table subscriptions
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("[get-subscription-status] Query result:", { data, error });

  if (error) {
    console.log("[get-subscription-status] Database error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  if (!data) {
    console.log("[get-subscription-status] No subscription found for user", userId);
    return new Response(JSON.stringify({ status: "none" }), { status: 200, headers: corsHeaders });
  }

  console.log("[get-subscription-status] Subscription found:", data);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: corsHeaders,
  });
});
