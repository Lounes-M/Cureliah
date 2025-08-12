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
    console.log("[test-db-structure] Testing database structure...");
    
    // Test 1: Vérifier si la table existe
    const { data: tableInfo, error: tableError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .limit(1);
    
    if (tableError) {
      console.log("[test-db-structure] Table error:", tableError);
    } else {
      console.log("[test-db-structure] Table exists, sample data:", tableInfo);
    }
    
    // Test 2: Essayer d'insérer une donnée de test
    const testData = {
      user_id: "test-user-123",
      stripe_customer_id: "cus_test",
      stripe_subscription_id: "sub_test",
      status: "active",
      current_period_end: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      plan_type: "premium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("[test-db-structure] Testing insert with data:", testData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from("user_subscriptions")
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log("[test-db-structure] Insert error:", insertError);
    } else {
      console.log("[test-db-structure] Insert success:", insertResult);
      
      // Supprimer la donnée test
      await supabase
        .from("user_subscriptions")
        .delete()
        .eq("user_id", "test-user-123");
    }
    
    return new Response(JSON.stringify({
      tableExists: !tableError,
      tableError: tableError?.message,
      insertSuccess: !insertError,
      insertError: insertError?.message,
      sampleData: tableInfo
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("[test-db-structure] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
