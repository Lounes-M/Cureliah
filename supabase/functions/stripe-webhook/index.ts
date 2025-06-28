import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

console.log("[stripe-webhook] Function started");

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Aucune vérification d'Authorization header ici !
serve(async (req) => {
  console.log("[stripe-webhook] Request received");
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    console.log("[stripe-webhook] Event type:", event.type);
  } catch (err) {
    console.error("[stripe-webhook] Webhook Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Connexion Supabase
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.7");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Gestion des événements pertinents
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    const object = event.data.object;
    let subscription, customer, userId, status, current_period_end, subscription_id;

    if (object.object === "checkout.session") {
      subscription_id = object.subscription;
      customer = object.customer;
      userId = object.metadata?.userId;
      console.log("[stripe-webhook] checkout.session.completed userId:", userId);
      // On va chercher la subscription Stripe pour avoir le status
      const sub = await stripe.subscriptions.retrieve(subscription_id);
      status = sub.status;
      current_period_end = new Date(sub.current_period_end * 1000).toISOString();
    } else {
      subscription = object;
      customer = subscription.customer;
      userId = subscription.metadata?.userId;
      status = subscription.status;
      current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      subscription_id = subscription.id;
      console.log(`[stripe-webhook] subscription event userId:`, userId, "status:", status);
    }

    if (userId) {
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: customer,
          stripe_subscription_id: subscription_id,
          status,
          current_period_end,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.error("[stripe-webhook] Supabase upsert error:", error.message);
      } else {
        console.log("[stripe-webhook] Subscription upserted for user:", userId, "status:", status);
      }
    } else {
      console.warn("[stripe-webhook] No userId found in event");
    }
  }

  return new Response("ok", { status: 200 });
});
