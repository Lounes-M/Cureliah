import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction pour générer une clé API sécurisée
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'ck_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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
      // Récupérer les clés API du médecin
      const { data: apiKeys, error } = await supabaseClient
        .from('api_keys')
        .select('id, key_name, permissions, rate_limit, usage_count, last_used, is_active, created_at')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération clés API:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des clés API' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: apiKeys || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { keyName, permissions, rateLimit } = await req.json()

      // Vérifier le nombre de clés existantes (limite de 5 par médecin)
      const { count, error: countError } = await supabaseClient
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('is_active', true)

      if (countError) {
        console.error('Erreur comptage clés:', countError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la vérification des clés' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (count && count >= 5) {
        return new Response(
          JSON.stringify({ error: 'Limite de 5 clés API atteinte' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Générer une nouvelle clé API
      const apiKey = generateApiKey()

      // Créer la clé API
      const { data, error } = await supabaseClient
        .from('api_keys')
        .insert([{
          doctor_id: user.id,
          api_key: apiKey,
          key_name: keyName,
          permissions: permissions || ['read'],
          rate_limit: rateLimit || 1000,
          is_active: true
        }])
        .select('id, key_name, permissions, rate_limit, usage_count, last_used, is_active, created_at')

      if (error) {
        console.error('Erreur création clé API:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création de la clé API' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { ...data[0], api_key: apiKey },
          message: 'Clé API créée avec succès' 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const keyId = url.pathname.split('/').pop()

      if (!keyId) {
        return new Response(
          JSON.stringify({ error: 'ID de clé manquant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Désactiver la clé API
      const { error } = await supabaseClient
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('doctor_id', user.id)

      if (error) {
        console.error('Erreur désactivation clé:', error)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la désactivation de la clé' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Clé API désactivée avec succès' 
        }),
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
