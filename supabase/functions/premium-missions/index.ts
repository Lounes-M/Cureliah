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
      // Récupérer les missions disponibles
      const { data: missions, error } = await supabaseClient
        .from('premium_missions')
        .select('*')
        .in('status', ['available', 'assigned'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération missions:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des missions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Si pas de missions, créer des exemples
      if (!missions || missions.length === 0) {
        const exampleMissions = [
          {
            title: 'Consultation cardiologique d\'urgence',
            description: 'Patient avec douleurs thoraciques, nécessite une consultation cardiologique immédiate',
            mission_type: 'urgent',
            specialty: 'cardiology',
            amount: 1500.00,
            urgency_level: 5,
            patient_location: 'Paris 15e',
            required_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2h
            status: 'available'
          },
          {
            title: 'Consultation neurologique spécialisée',
            description: 'Cas complexe de neurologie nécessitant une expertise approfondie',
            mission_type: 'specialized',
            specialty: 'neurology',
            amount: 800.00,
            urgency_level: 3,
            patient_location: 'Lyon 6e',
            required_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Dans 24h
            status: 'available'
          },
          {
            title: 'Téléconsultation VIP',
            description: 'Patient premium demandant un suivi personnalisé',
            mission_type: 'vip',
            specialty: 'general_medicine',
            amount: 600.00,
            urgency_level: 2,
            patient_location: 'Marseille',
            required_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Dans 48h
            status: 'available'
          }
        ]

        // Insérer les missions d'exemple
        const { error: insertError } = await supabaseClient
          .from('premium_missions')
          .insert(exampleMissions)

        if (insertError) {
          console.error('Erreur insertion missions:', insertError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: exampleMissions,
            message: 'Missions générées avec succès' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: missions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { missionId, action } = await req.json()

      if (action === 'accept') {
        // Assigner la mission au médecin
        const { data, error } = await supabaseClient
          .from('premium_missions')
          .update({ 
            assigned_doctor_id: user.id,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', missionId)
          .eq('status', 'available')
          .select()

        if (error) {
          console.error('Erreur assignation mission:', error)
          return new Response(
            JSON.stringify({ error: 'Erreur lors de l\'assignation de la mission' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!data || data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Mission non disponible ou déjà assignée' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: data[0],
            message: 'Mission acceptée avec succès' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Action non reconnue' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
