import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { userId, creditAmount, pricePerCredit, returnUrl, cancelUrl } = await req.json()

    if (!userId || !creditAmount || !pricePerCredit) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${creditAmount} crédits Cureliah`,
              description: `Pack de ${creditAmount} crédits pour publier des demandes urgentes`,
              images: ['https://your-domain.com/credits-icon.png'], // Ajoutez une image si disponible
            },
            unit_amount: Math.round(pricePerCredit * 100), // Stripe utilise les centimes
          },
          quantity: creditAmount,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: user.user?.email,
      metadata: {
        userId: userId,
        creditAmount: creditAmount.toString(),
        type: 'credits_purchase'
      },
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expire dans 30 minutes
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while creating the checkout session' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
