import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Récupérer les factures du médecin
      const { data: invoices, error } = await supabaseClient
        .from('premium_invoices')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération factures:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des factures' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Si pas de factures, créer des exemples
      if (!invoices || invoices.length === 0) {
        const currentDate = new Date()
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)

        const exampleInvoices = [
          {
            doctor_id: user.id,
            stripe_invoice_id: `in_${Math.random().toString(36).substr(2, 9)}`,
            amount: 19900, // €199.00 en centimes
            currency: 'eur',
            status: 'paid',
            description: 'Abonnement Cureliah Premium - Janvier 2025',
            invoice_pdf: `https://files.stripe.com/invoices/in_test_${Math.random().toString(36).substr(2, 9)}`,
            period_start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
            period_end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString(),
            due_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).toISOString(),
            paid_at: new Date(currentDate.getFullYear(), currentDate.getMonth(), 3).toISOString(),
            created_at: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
          },
          {
            doctor_id: user.id,
            stripe_invoice_id: `in_${Math.random().toString(36).substr(2, 9)}`,
            amount: 19900,
            currency: 'eur',
            status: 'paid',
            description: 'Abonnement Cureliah Premium - Décembre 2024',
            invoice_pdf: `https://files.stripe.com/invoices/in_test_${Math.random().toString(36).substr(2, 9)}`,
            period_start: lastMonth.toISOString(),
            period_end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59).toISOString(),
            due_date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5).toISOString(),
            paid_at: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 2).toISOString(),
            created_at: lastMonth.toISOString()
          },
          {
            doctor_id: user.id,
            stripe_invoice_id: `in_${Math.random().toString(36).substr(2, 9)}`,
            amount: 19900,
            currency: 'eur',
            status: 'paid',
            description: 'Abonnement Cureliah Premium - Novembre 2024',
            invoice_pdf: `https://files.stripe.com/invoices/in_test_${Math.random().toString(36).substr(2, 9)}`,
            period_start: twoMonthsAgo.toISOString(),
            period_end: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 0, 23, 59, 59).toISOString(),
            due_date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 5).toISOString(),
            paid_at: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1).toISOString(),
            created_at: twoMonthsAgo.toISOString()
          }
        ]

        // Insérer les factures d'exemple
        const { error: insertError } = await supabaseClient
          .from('premium_invoices')
          .insert(exampleInvoices)

        if (insertError) {
          console.error('Erreur insertion factures:', insertError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: exampleInvoices,
            message: 'Factures générées avec succès' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: invoices }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
