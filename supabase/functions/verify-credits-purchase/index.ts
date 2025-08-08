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

    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session || session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not completed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = session.metadata?.userId
    const creditAmount = parseInt(session.metadata?.creditAmount || '0')

    if (!userId || !creditAmount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session metadata' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier si cette transaction a déjà été traitée
    const { data: existingTransaction } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .single()

    if (existingTransaction) {
      // Transaction déjà traitée, retourner les crédits actuels
      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      return new Response(
        JSON.stringify({ success: true, credits }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ajouter les crédits via la fonction PostgreSQL
    const { data: updatedCredits, error } = await supabase.rpc('purchase_credits', {
      p_user_id: userId,
      p_amount: creditAmount,
      p_payment_intent_id: session.payment_intent,
      p_description: `Achat de ${creditAmount} crédits via Stripe`
    })

    if (error) {
      console.error('Error adding credits:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to add credits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, credits: updatedCredits }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying purchase:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred while verifying the purchase' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
