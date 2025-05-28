
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Get request body
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('vacation_bookings')
      .select(`
        *,
        vacation_post:vacation_posts(*),
        doctor_profile:profiles!vacation_bookings_doctor_id_fkey(first_name, last_name),
        establishment_profile:profiles!vacation_bookings_establishment_id_fkey(first_name, last_name)
      `)
      .eq('id', bookingId)
      .eq('establishment_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or access denied");
    }

    // Check if payment already exists
    if (booking.stripe_session_id) {
      throw new Error("Payment already initiated for this booking");
    }

    // Calculate amount (total_amount is in euros, Stripe expects cents)
    const amount = Math.round((booking.total_amount || 0) * 100);
    
    if (amount <= 0) {
      throw new Error("Invalid booking amount");
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Vacation: ${booking.vacation_post.title}`,
              description: `Du ${new Date(booking.vacation_post.start_date).toLocaleDateString('fr-FR')} au ${new Date(booking.vacation_post.end_date).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/establishment-dashboard?payment=success&booking=${bookingId}`,
      cancel_url: `${req.headers.get("origin")}/establishment-dashboard?payment=cancelled&booking=${bookingId}`,
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
      },
    });

    // Update booking with Stripe session ID
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: updateError } = await supabaseService
      .from('vacation_bookings')
      .update({
        stripe_session_id: session.id,
        payment_status: 'pending'
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
