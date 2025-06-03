import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

interface PaymentData {
  booking_id: string;
  establishment_id: string;
}

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { data: payment, error: paymentError } = await supabase
    .from("stripe_payments")
    .select("booking_id, establishment_id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .single();

  if (paymentError) throw paymentError;

  const { error: bookingError } = await supabase
    .from("vacation_bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.booking_id);

  if (bookingError) throw bookingError;

  // Create notification for the establishment
  const { error: notificationError } = await supabase.from("notifications").insert([
    {
      user_id: payment.establishment_id,
      title: "Payment Received",
      message: `Payment of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} has been received for booking #${payment.booking_id}`,
      type: "payment",
      data: {
        booking_id: payment.booking_id,
        payment_intent_id: paymentIntent.id,
      },
    },
  ]);

  if (notificationError) throw notificationError;
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { data: payment, error: paymentError } = await supabase
    .from("stripe_payments")
    .select("booking_id, establishment_id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .single();

  if (paymentError) throw paymentError;

  const { error: bookingError } = await supabase
    .from("vacation_bookings")
    .update({
      status: "payment_failed",
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.booking_id);

  if (bookingError) throw bookingError;

  // Create notification for the establishment
  const { error: notificationError } = await supabase.from("notifications").insert([
    {
      user_id: payment.establishment_id,
      title: "Payment Failed",
      message: `Payment for booking #${payment.booking_id} has failed. Please try again.`,
      type: "payment_error",
      data: {
        booking_id: payment.booking_id,
        payment_intent_id: paymentIntent.id,
      },
    },
  ]);

  if (notificationError) throw notificationError;
} 