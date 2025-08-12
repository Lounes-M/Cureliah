import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("[create-table] Attempting to create user_subscriptions table via direct query...");
    
    // Essayer de créer la table via une requête SQL brute
    const { data, error } = await supabase
      .from('_sql_query')
      .select('*')
      .limit(0);
    
    console.log("Test query result:", { data, error });
    
    // Alternative: essayer de créer via une requête post directe
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'Content-Type': 'application/json',
        'apikey': Deno.env.get("SUPABASE_ANON_KEY")!,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: `
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            stripe_customer_id TEXT NOT NULL,
            stripe_subscription_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL,
            current_period_start TIMESTAMPTZ NOT NULL,
            current_period_end TIMESTAMPTZ NOT NULL,
            plan_type TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        `
      })
    });
    
    const result = await response.text();
    console.log("Direct SQL result:", result);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Table creation attempted",
      result: result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("[create-table] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
