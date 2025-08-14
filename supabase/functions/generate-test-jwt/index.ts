import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("[generate-test-jwt] Generating test JWT for user with subscription");
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        headers: corsHeaders, status: 500
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Récupérer un utilisateur avec un abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("status", "active")
      .limit(1)
      .single();
    
    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        headers: corsHeaders, status: 404
      });
    }

    const userId = subscription.user_id;
    console.log("[generate-test-jwt] Found user with active subscription:", userId);
    
    // Récupérer les infos de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: corsHeaders, status: 404
      });
    }

    console.log("[generate-test-jwt] User found:", user.email);
    
    // Créer une session temporaire pour cet utilisateur
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({ error: "Could not generate session" }), {
        headers: corsHeaders, status: 500
      });
    }

    return new Response(JSON.stringify({ 
      userId,
      email: user.email,
      message: "Use the magic link to get a valid JWT",
      magicLink: sessionData.properties.action_link
    }), {
      headers: corsHeaders, status: 200
    });
    
  } catch (error) {
    console.error("[generate-test-jwt] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: corsHeaders, status: 500
    });
  }
});
