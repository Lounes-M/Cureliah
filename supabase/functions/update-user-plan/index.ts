import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const jwt = authHeader.replace("Bearer ", "");
  
  // Décoder le JWT pour obtenir l'user id
  let userId;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    userId = payload.sub;
    console.log("[update-user-plan] userId:", userId);
  } catch (e) {
    console.error("[update-user-plan] Invalid JWT:", e);
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const { newPlan } = await req.json();
  if (!newPlan || !['essentiel', 'pro', 'premium'].includes(newPlan)) {
    return new Response(JSON.stringify({ error: "Invalid plan type" }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  // Créer un client Supabase avec le service role
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log(`[update-user-plan] Updating plan to ${newPlan} for user ${userId}`);
    
    // Mettre à jour le plan_type de l'utilisateur
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({ 
        plan_type: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[update-user-plan] Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log("[update-user-plan] Plan updated successfully:", data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      data,
      message: `Plan updated to ${newPlan}` 
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("[update-user-plan] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
