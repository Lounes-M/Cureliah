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
  console.log("[create-customer-portal] ===========================================");
  console.log("[create-customer-portal] NEW REQUEST RECEIVED");
  console.log("[create-customer-portal] Method:", req.method);
  console.log("[create-customer-portal] URL:", req.url);
  console.log("[create-customer-portal] Headers:", Object.fromEntries(req.headers.entries()));
  console.log("[create-customer-portal] ===========================================");
  
  if (req.method === "OPTIONS") {
    console.log("[create-customer-portal] OPTIONS preflight - returning CORS headers");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[create-customer-portal] STEP 1: Checking environment variables...");
    
    // Vérification des variables d'environnement
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://cureliah.com";
    
    console.log("[create-customer-portal] Environment variables status:");
    console.log("- SUPABASE_URL:", SUPABASE_URL ? `SET (${SUPABASE_URL.substring(0, 30)}...)` : "MISSING");
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? `SET (${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : "MISSING");
    console.log("- STRIPE_SECRET_KEY:", STRIPE_SECRET_KEY ? `SET (${STRIPE_SECRET_KEY.substring(0, 20)}...)` : "MISSING");
    console.log("- APP_BASE_URL:", APP_BASE_URL);
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      console.error("[create-customer-portal] ERROR: Missing critical environment variables!");
      console.error("- SUPABASE_URL:", !!SUPABASE_URL);
      console.error("- SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY); 
      console.error("- STRIPE_SECRET_KEY:", !!STRIPE_SECRET_KEY);
      return new Response(
        JSON.stringify({ error: "Configuration error" }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("[create-customer-portal] STEP 2: Checking authorization header...");
    
    // Authentification JWT Supabase
    const authHeader = req.headers.get("authorization");
    console.log("[create-customer-portal] Authorization header:", authHeader ? `Present (${authHeader.substring(0, 30)}...)` : "MISSING");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[create-customer-portal] ERROR: Missing or invalid authorization header");
      console.error("- Auth header present:", !!authHeader);
      console.error("- Starts with Bearer:", authHeader?.startsWith("Bearer "));
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: corsHeaders }
      );
    }

    console.log("[create-customer-portal] STEP 3: Creating Supabase client...");
    
    // Créer le client Supabase avec vérification d'authentification
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    console.log("[create-customer-portal] Supabase client created successfully");

    console.log("[create-customer-portal] STEP 4: Extracting and validating JWT...");
    
    // Vérifier l'utilisateur via Supabase Auth
    const jwt = authHeader.replace("Bearer ", "");
    console.log("[create-customer-portal] JWT extracted:", jwt.substring(0, 50) + "...");
    
    console.log("[create-customer-portal] STEP 5: Calling supabase.auth.getUser()...");
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    
    console.log("[create-customer-portal] Auth result:");
    console.log("- Error:", userError);
    console.log("- User data:", userData ? {
      user: userData.user ? {
        id: userData.user.id,
        email: userData.user.email,
        aud: userData.user.aud,
        role: userData.user.role
      } : null
    } : null);
    
    if (userError || !userData.user) {
      console.error("[create-customer-portal] ERROR: Authentication failed!");
      console.error("- User error:", userError);
      console.error("- User data:", userData);
      console.error("- JWT used:", jwt.substring(0, 100) + "...");
      return new Response(
        JSON.stringify({ 
          error: "Invalid authentication token",
          details: userError?.message || "No user found"
        }), 
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = userData.user.id;
    console.log("[create-customer-portal] STEP 6: User authenticated successfully!");
    console.log("- User ID:", userId);
    console.log("- User email:", userData.user.email);

    console.log("[create-customer-portal] STEP 7: Initializing Stripe client...");
    
    // Initialiser Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    console.log("[create-customer-portal] Stripe client initialized");

    console.log("[create-customer-portal] STEP 8: Querying user subscription...");
    
    // Rechercher ou créer l'enregistrement subscription
    let { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, status, plan_type")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("[create-customer-portal] Subscription query completed:");
    console.log("- Query error:", subError);
    console.log("- Subscription found:", !!subscription);
    console.log("- Subscription data:", subscription);

    // Si pas de subscription trouvée, créer un customer Stripe
    if (!subscription || !subscription.stripe_customer_id) {
      console.log("[create-customer-portal] STEP 9: No existing customer found, creating new one...");
      console.log("- Subscription exists:", !!subscription);
      console.log("- Has Stripe customer ID:", !!subscription?.stripe_customer_id);
      
      console.log("[create-customer-portal] STEP 9.1: Fetching user profile...");
      
      // Récupérer les informations utilisateur depuis le profil
      const { data: profile, error: profileError } = await supabase
        .from("doctor_profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      console.log("[create-customer-portal] Profile query result:");
      console.log("- Profile error:", profileError);
      console.log("- Profile data:", profile);
      
      console.log("[create-customer-portal] STEP 9.2: Creating Stripe customer...");
      
      // Créer le customer Stripe
      const customerData = {
        email: userData.user.email,
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined,
        metadata: {
          supabase_user_id: userId,
          created_via: "portal_access"
        }
      };
      
      console.log("[create-customer-portal] Customer data to create:", customerData);
      
      const customer = await stripe.customers.create(customerData);

      console.log("[create-customer-portal] STEP 9.3: Stripe customer created successfully!");
      console.log("- Customer ID:", customer.id);
      console.log("- Customer email:", customer.email);

      console.log("[create-customer-portal] STEP 9.4: Updating database with new customer...");
      
      // Insérer ou mettre à jour la subscription
      const subscriptionData = {
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: `portal_access_${userId}`,
        status: "no_subscription",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_type: "free"
      };
      
      console.log("[create-customer-portal] Subscription data to upsert:", subscriptionData);
      
      const { error: insertError } = await supabase
        .from("user_subscriptions")
        .upsert(subscriptionData, {
          onConflict: "user_id"
        });

      if (insertError) {
        console.error("[create-customer-portal] ERROR: Database insert failed!");
        console.error("- Insert error:", insertError);
        console.error("- Subscription data:", subscriptionData);
        return new Response(
          JSON.stringify({ error: "Database error", details: insertError.message }), 
          { status: 500, headers: corsHeaders }
        );
      }

      console.log("[create-customer-portal] Database updated successfully!");
      subscription = { stripe_customer_id: customer.id };
    } else {
      console.log("[create-customer-portal] STEP 9: Using existing customer:", subscription.stripe_customer_id);
    }

    console.log("[create-customer-portal] STEP 10: Creating Stripe billing portal session...");
    console.log("- Customer ID:", subscription.stripe_customer_id);
    console.log("- Return URL:", `${APP_BASE_URL}/doctor/dashboard?tab=subscription`);
    
    // Créer la session de portail Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${APP_BASE_URL}/doctor/dashboard?tab=subscription`,
    });

    console.log("[create-customer-portal] STEP 11: Portal session created successfully!");
    console.log("- Session ID:", portalSession.id);
    console.log("- Portal URL:", portalSession.url);
    
    const responseData = { 
      url: portalSession.url,
      customer_id: subscription.stripe_customer_id 
    };
    
    console.log("[create-customer-portal] STEP 12: Sending successful response:");
    console.log("- Response data:", responseData);
    
    return new Response(
      JSON.stringify(responseData), 
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("[create-customer-portal] ===========================================");
    console.error("[create-customer-portal] FATAL ERROR OCCURRED!");
    console.error("[create-customer-portal] ===========================================");
    console.error("[create-customer-portal] Error type:", typeof error);
    console.error("[create-customer-portal] Error name:", error?.name);
    console.error("[create-customer-portal] Error message:", error?.message);
    console.error("[create-customer-portal] Error stack:", error?.stack);
    console.error("[create-customer-portal] Full error object:", error);
    console.error("[create-customer-portal] ===========================================");
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error?.message || "Unknown error",
        type: error?.name || "UnknownError"
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
