import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { bookingId, amount } = await req.json();

    if (!bookingId || !amount) {
      throw new Error("bookingId and amount are required");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        total_amount,
        status,
        establishment_id,
        doctor_id,
        vacation_posts (
          title,
          doctor_profiles (
            first_name,
            last_name
          )
        ),
        establishment_profiles (
          name
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "confirmed") {
      throw new Error("Booking must be confirmed before payment");
    }

    // Get environment-specific URLs
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('/supabase', '') || "http://localhost:8080";
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Vacation: ${booking.vacation_posts?.title || 'Medical Service'}`,
              description: `Payment for medical vacation with Dr. ${booking.vacation_posts?.doctor_profiles?.first_name} ${booking.vacation_posts?.doctor_profiles?.last_name}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        establishmentId: booking.establishment_id,
        doctorId: booking.doctor_id,
        type: "booking_payment",
      },
      success_url: `${baseUrl}/payment-success?booking_id=${bookingId}`,
      cancel_url: `${baseUrl}/payment-failure?booking_id=${bookingId}`,
    });

    // Update booking with payment intent
    await supabase
      .from("bookings")
      .update({
        payment_status: "pending",
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Payment creation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
