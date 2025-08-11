import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

console.log("[stripe-webhook] Function started");

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Aucune vérification d'Authorization header ici !
serve(async (req) => {
  console.log("[stripe-webhook] Request received");
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, endpointSecret);
    console.log("[stripe-webhook] Event type:", event.type);
  } catch (err) {
    console.error("[stripe-webhook] Webhook Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Gestion des événements pertinents
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.payment_failed"
  ) {
    const object = event.data.object;
    
    // Gestion des paiements de réservations
    if (event.type === "checkout.session.completed" && object.mode === "payment") {
      const bookingId = object.metadata?.bookingId;
      const paymentIntentId = object.payment_intent;
      
      if (bookingId) {
        console.log("[stripe-webhook] Processing booking payment:", bookingId);
        
        // Mettre à jour le statut de la réservation
        const { error: bookingError } = await supabase
          .from("vacation_bookings")
          .update({
            payment_status: "completed",
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString()
          })
          .eq("id", bookingId);
          
        if (bookingError) {
          console.error("[stripe-webhook] Booking update error:", bookingError.message);
        } else {
          console.log("[stripe-webhook] Booking payment completed:", bookingId);
          
          // Créer une notification pour le médecin
          const { data: booking } = await supabase
            .from("vacation_bookings")
            .select("doctor_id, establishment_profiles(name)")
            .eq("id", bookingId)
            .single();
            
          if (booking) {
            await supabase
              .from("notifications")
              .insert({
                user_id: booking.doctor_id,
                title: "Paiement reçu !",
                message: `Le paiement de ${booking.establishment_profiles?.name || 'l\'établissement'} a été confirmé.`,
                type: "payment",
                data: { booking_id: bookingId }
              });
          }
        }
        
        return new Response("ok", { status: 200 });
      }
    }
    
    // Gestion des échecs de paiement
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = object;
      const bookingId = paymentIntent.metadata?.bookingId;
      
      if (bookingId) {
        console.log("[stripe-webhook] Processing failed payment:", bookingId);
        
        const { error } = await supabase
          .from("vacation_bookings")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", bookingId);
          
        if (error) {
          console.error("[stripe-webhook] Failed payment update error:", error.message);
        }
        
        return new Response("ok", { status: 200 });
      }
    }

    // Gestion des abonnements (code existant)
    let subscription, customer, userId, status, current_period_end, subscription_id;

    if (object.object === "checkout.session" && object.mode === "subscription") {
      subscription_id = object.subscription;
      customer = object.customer;
      userId = object.metadata?.userId;
      console.log("[stripe-webhook] checkout.session.completed userId:", userId);
      // On va chercher la subscription Stripe pour avoir le status
      const sub = await stripe.subscriptions.retrieve(subscription_id);
      status = sub.status;
      current_period_end = new Date(sub.current_period_end * 1000).toISOString();
    } else if (object.object === "subscription") {
      subscription = object;
      customer = subscription.customer;
      userId = subscription.metadata?.userId;
      status = subscription.status;
      current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      subscription_id = subscription.id;
      console.log(`[stripe-webhook] subscription event userId:`, userId, "status:", status);
    }

    if (userId && subscription_id) {
      // Récupérer le type d'utilisateur pour choisir la bonne table
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error("[stripe-webhook] Error fetching user:", userError.message);
        return new Response("User fetch error", { status: 500 });
      }

      const userType = userData?.user?.user_metadata?.user_type || 'doctor';
      const tableName = userType === 'doctor' ? 'user_subscriptions' : 'establishment_subscriptions';
      
      console.log(`[stripe-webhook] Using table: ${tableName} for user type: ${userType}`);
      
      const { error } = await supabase
        .from(tableName)
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
    }
  }

  return new Response("ok", { status: 200 });
});
