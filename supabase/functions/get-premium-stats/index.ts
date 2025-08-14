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

    // Récupérer les statistiques du médecin
    const currentMonth = new Date()
    currentMonth.setDate(1) // Premier du mois

    // 1. Récupérer les statistiques du mois courant
    const { data: currentStats, error: statsError } = await supabaseClient
      .from('doctor_statistics')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('month', currentMonth.toISOString().split('T')[0])
      .single()

    // 2. Récupérer les statistiques des 6 derniers mois pour le trend
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: historicalStats, error: histError } = await supabaseClient
      .from('doctor_statistics')
      .select('*')
      .eq('doctor_id', user.id)
      .gte('month', sixMonthsAgo.toISOString().split('T')[0])
      .order('month', { ascending: true })

    // 3. Calculer les totaux et les tendances
    let totalRevenue = 0
    let totalMissions = 0
    let avgRating = 0
    let monthlyTrend = 0

    if (currentStats && !statsError) {
      totalRevenue = parseFloat(currentStats.total_revenue || 0)
      totalMissions = currentStats.total_missions || 0
      avgRating = parseFloat(currentStats.avg_rating || 0)
    }

    // Calculer la tendance mensuelle
    if (historicalStats && historicalStats.length >= 2) {
      const lastMonth = historicalStats[historicalStats.length - 1]
      const previousMonth = historicalStats[historicalStats.length - 2]
      
      if (lastMonth && previousMonth && previousMonth.total_revenue > 0) {
        monthlyTrend = ((lastMonth.total_revenue - previousMonth.total_revenue) / previousMonth.total_revenue) * 100
      }
    }

    // 4. Si pas de données, retourner des valeurs par défaut
    if (!currentStats) {
      totalRevenue = 0
      totalMissions = 0
      avgRating = 0
      monthlyTrend = 0
    }

    // 5. Récupérer des insights IA récents
    const { data: insights } = await supabaseClient
      .from('ai_insights')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(3)

    // 6. Préparer la réponse
    const response = {
      success: true,
      data: {
        totalRevenue,
        totalMissions,
        avgRating,
        monthlyTrend: Math.round(monthlyTrend * 10) / 10,
        monthlyData: historicalStats?.map(stat => ({
          month: stat.month,
          revenue: parseFloat(stat.total_revenue || 0),
          missions: stat.total_missions || 0
        })) || [],
        insights: insights || []
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
