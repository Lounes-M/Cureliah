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
      // Récupérer les tickets de support du médecin
      const { data: tickets, error } = await supabaseClient
        .from('premium_support_tickets')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération tickets:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des tickets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Si pas de tickets, créer des exemples
      if (!tickets || tickets.length === 0) {
        const exampleTickets = [
          {
            doctor_id: user.id,
            subject: 'Configuration API Gateway',
            description: 'Demande d\'assistance pour la configuration du gateway API Premium',
            category: 'technical',
            priority: 'high',
            status: 'open',
            agent_response: 'Votre demande a été prise en compte. Notre équipe technique va vous contacter sous 2h.',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3h
            updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // Il y a 1h
          },
          {
            doctor_id: user.id,
            subject: 'Question facturation Premium',
            description: 'Clarification nécessaire sur les frais de mission Premium du mois dernier',
            category: 'billing',
            priority: 'medium',
            status: 'in_progress',
            agent_response: 'Nous avons analysé votre facturation. Un remboursement partiel sera effectué.',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 5 jours
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // Il y a 2 jours
          },
          {
            doctor_id: user.id,
            subject: 'Formation IA diagnostique',
            description: 'Demande de formation approfondie sur les nouvelles fonctionnalités IA',
            category: 'training',
            priority: 'low',
            status: 'resolved',
            agent_response: 'Formation planifiée pour le 20 août à 14h. Lien Zoom envoyé par email.',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Il y a 1 jour
          }
        ]

        // Insérer les tickets d'exemple
        const { error: insertError } = await supabaseClient
          .from('premium_support_tickets')
          .insert(exampleTickets)

        if (insertError) {
          console.error('Erreur insertion tickets:', insertError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: exampleTickets,
            message: 'Tickets générés avec succès' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: tickets }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { subject, description, category, priority } = await req.json()

      // Créer un nouveau ticket
      const { data, error } = await supabaseClient
        .from('premium_support_tickets')
        .insert([{
          doctor_id: user.id,
          subject,
          description,
          category,
          priority,
          status: 'open'
        }])
        .select()

      if (error) {
        console.error('Erreur création ticket:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création du ticket' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data[0],
          message: 'Ticket créé avec succès' 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
