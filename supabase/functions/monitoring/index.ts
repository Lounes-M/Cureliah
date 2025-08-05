import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ErrorReport {
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
  userType?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userId?: string;
  context?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { pathname } = new URL(req.url);

    if (pathname === '/errors' && req.method === 'POST') {
      const errorReport: ErrorReport = await req.json();

      // Valider les données requises
      if (!errorReport.message || !errorReport.url) {
        return new Response(
          JSON.stringify({ error: 'Message and URL are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Stocker l'erreur dans la base de données
      const { error } = await supabaseClient
        .from('error_reports')
        .insert([
          {
            message: errorReport.message,
            stack: errorReport.stack,
            user_agent: errorReport.userAgent,
            url: errorReport.url,
            timestamp: new Date(errorReport.timestamp).toISOString(),
            user_id: errorReport.userId,
            user_type: errorReport.userType,
            severity: errorReport.severity,
            context: errorReport.context,
            resolved: false
          }
        ]);

      if (error) {
        console.error('Error storing error report:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store error report' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Si l'erreur est critique, envoyer une alerte
      if (errorReport.severity === 'critical') {
        await sendCriticalErrorAlert(errorReport);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (pathname === '/performance' && req.method === 'POST') {
      const performanceMetric: PerformanceMetric = await req.json();

      // Valider les données requises
      if (!performanceMetric.name || performanceMetric.value === undefined) {
        return new Response(
          JSON.stringify({ error: 'Name and value are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Stocker la métrique de performance
      const { error } = await supabaseClient
        .from('performance_metrics')
        .insert([
          {
            name: performanceMetric.name,
            value: performanceMetric.value,
            timestamp: new Date(performanceMetric.timestamp).toISOString(),
            url: performanceMetric.url,
            user_id: performanceMetric.userId,
            context: performanceMetric.context
          }
        ]);

      if (error) {
        console.error('Error storing performance metric:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store performance metric' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Vérifier si la performance est dégradée
      await checkPerformanceThresholds(performanceMetric, supabaseClient);

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (pathname === '/health' && req.method === 'GET') {
      // Endpoint de santé pour vérifier le service
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in monitoring function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendCriticalErrorAlert(errorReport: ErrorReport) {
  try {
    // Ici, vous pourriez intégrer avec un service d'alertes comme:
    // - Email via Resend
    // - Slack webhook
    // - Discord webhook
    // - SMS via Twilio
    
    console.log('🚨 CRITICAL ERROR ALERT:', {
      message: errorReport.message,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: new Date(errorReport.timestamp).toISOString()
    });

    // Exemple d'envoi d'email d'alerte
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'admin@cureliah.com',
        subject: '🚨 Critical Error Alert - Cureliah Platform',
        template: 'critical_error',
        data: {
          message: errorReport.message,
          url: errorReport.url,
          userId: errorReport.userId || 'Anonymous',
          userType: errorReport.userType || 'Unknown',
          timestamp: new Date(errorReport.timestamp).toLocaleString(),
          stack: errorReport.stack?.substring(0, 500) + '...',
          context: JSON.stringify(errorReport.context, null, 2)
        }
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send critical error alert email');
    }

  } catch (error) {
    console.error('Error sending critical error alert:', error);
  }
}

async function checkPerformanceThresholds(metric: PerformanceMetric, supabaseClient: any) {
  const thresholds: Record<string, number> = {
    'page-load-time': 3000, // 3 secondes
    'first-contentful-paint': 1800, // 1.8 secondes
    'largest-contentful-paint': 2500, // 2.5 secondes
    'cumulative-layout-shift': 0.1, // 0.1
    'first-input-delay': 100 // 100ms
  };

  const threshold = thresholds[metric.name];
  if (threshold && metric.value > threshold) {
    // Performance dégradée détectée
    console.warn('⚠️ Performance threshold exceeded:', {
      metric: metric.name,
      value: metric.value,
      threshold: threshold,
      url: metric.url
    });

    // Créer une alerte de performance
    await supabaseClient
      .from('performance_alerts')
      .insert([
        {
          metric_name: metric.name,
          value: metric.value,
          threshold: threshold,
          url: metric.url,
          user_id: metric.userId,
          timestamp: new Date(metric.timestamp).toISOString(),
          resolved: false
        }
      ]);
  }
}
