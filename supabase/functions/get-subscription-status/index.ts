import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  // Authentification JWT Supabase
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), { status: 401 });
  }
  const jwt = authHeader.replace("Bearer ", "");

  // Récupération des variables d'environnement
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
  }

  // Décoder le JWT pour obtenir l'user id
  let userId;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userId = payload.sub;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401 });
  }

  // Créer un client Supabase avec le service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Lire la table subscriptions
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plan_id, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!data) {
    return new Response(JSON.stringify({ status: "none" }), { status: 200 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
