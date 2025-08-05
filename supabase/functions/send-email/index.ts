import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

interface EmailTemplate {
  booking_confirmed: {
    subject: string;
    template: (data: any) => string;
  };
  payment_received: {
    subject: string;
    template: (data: any) => string;
  };
  booking_cancelled: {
    subject: string;
    template: (data: any) => string;
  };
  new_booking_request: {
    subject: string;
    template: (data: any) => string;
  };
  critical_error: {
    subject: string;
    template: (data: any) => string;
  };
}

const EMAIL_TEMPLATES: EmailTemplate = {
  booking_confirmed: {
    subject: "Réservation confirmée - Cureliah",
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Réservation confirmée ✅</h2>
        <p>Bonjour ${data.user_name},</p>
        <p>Votre réservation pour la vacation <strong>"${data.vacation_title}"</strong> a été confirmée.</p>
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Détails de la réservation :</h3>
          <p><strong>Date :</strong> ${data.start_date} - ${data.end_date}</p>
          <p><strong>Médecin :</strong> ${data.doctor_name}</p>
          <p><strong>Lieu :</strong> ${data.location}</p>
          <p><strong>Montant :</strong> ${data.amount}€</p>
        </div>
        <p>Vous pouvez retrouver tous les détails dans votre tableau de bord.</p>
        <a href="${data.dashboard_url}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir ma réservation</a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          L'équipe Cureliah<br>
          <a href="mailto:support@cureliah.com">support@cureliah.com</a>
        </p>
      </div>
    `
  },
  payment_received: {
    subject: "Paiement reçu - Cureliah",
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Paiement reçu 💳</h2>
        <p>Bonjour Dr. ${data.doctor_name},</p>
        <p>Le paiement pour votre vacation <strong>"${data.vacation_title}"</strong> a été reçu.</p>
        <div style="background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Détails du paiement :</h3>
          <p><strong>Montant :</strong> ${data.amount}€</p>
          <p><strong>Établissement :</strong> ${data.establishment_name}</p>
          <p><strong>Date :</strong> ${data.payment_date}</p>
        </div>
        <p>Le montant sera transféré sur votre compte selon nos conditions générales.</p>
        <a href="${data.dashboard_url}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir mes gains</a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          L'équipe Cureliah<br>
          <a href="mailto:support@cureliah.com">support@cureliah.com</a>
        </p>
      </div>
    `
  },
  booking_cancelled: {
    subject: "Réservation annulée - Cureliah",
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Réservation annulée ❌</h2>
        <p>Bonjour ${data.user_name},</p>
        <p>Votre réservation pour la vacation <strong>"${data.vacation_title}"</strong> a été annulée.</p>
        <div style="background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Détails de l'annulation :</h3>
          <p><strong>Raison :</strong> ${data.cancellation_reason}</p>
          <p><strong>Date d'annulation :</strong> ${data.cancellation_date}</p>
        </div>
        <p>Si un paiement a été effectué, le remboursement sera traité dans les prochains jours ouvrés.</p>
        <a href="${data.search_url}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Rechercher d'autres vacations</a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          L'équipe Cureliah<br>
          <a href="mailto:support@cureliah.com">support@cureliah.com</a>
        </p>
      </div>
    `
  },
  new_booking_request: {
    subject: "Nouvelle demande de réservation - Cureliah",
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Nouvelle demande de réservation 🔔</h2>
        <p>Bonjour Dr. ${data.doctor_name},</p>
        <p>Vous avez reçu une nouvelle demande de réservation pour votre vacation <strong>"${data.vacation_title}"</strong>.</p>
        <div style="background: #faf5ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Détails de la demande :</h3>
          <p><strong>Établissement :</strong> ${data.establishment_name}</p>
          <p><strong>Période :</strong> ${data.start_date} - ${data.end_date}</p>
          <p><strong>Message :</strong> ${data.message}</p>
        </div>
        <p>Veuillez répondre rapidement pour confirmer ou décliner cette demande.</p>
        <a href="${data.booking_url}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Gérer la demande</a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          L'équipe Cureliah<br>
          <a href="mailto:support@cureliah.com">support@cureliah.com</a>
        </p>
      </div>
    `
  },
  critical_error: {
    subject: "🚨 Alerte Critique - Erreur Système Cureliah",
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; border-left: 4px solid #dc2626; padding-left: 16px;">
          🚨 ALERTE CRITIQUE - Erreur Système
        </h2>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Détails de l'erreur:</h3>
          <p><strong>Message:</strong> ${data.message}</p>
          <p><strong>URL:</strong> ${data.url}</p>
          <p><strong>Utilisateur:</strong> ${data.userId} (${data.userType})</p>
          <p><strong>Timestamp:</strong> ${data.timestamp}</p>
        </div>
        ${data.stack ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4>Stack Trace:</h4>
          <pre style="font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${data.stack}</pre>
        </div>
        ` : ''}
        ${data.context ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4>Contexte:</h4>
          <pre style="font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${data.context}</pre>
        </div>
        ` : ''}
        <div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Action requise:</strong> Cette erreur nécessite une attention immédiate. 
            Veuillez vous connecter au tableau de bord de monitoring pour investiguer.
          </p>
        </div>
        <a href="https://cureliah.com/admin/monitoring" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir le Dashboard</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Ce message a été généré automatiquement par le système de monitoring Cureliah.
        </p>
      </div>
    `
  }
};

serve(async (req: Request): Promise<Response> => {
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
    const { type, to, data } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!EMAIL_TEMPLATES[type as keyof EmailTemplate]) {
      throw new Error(`Unknown email template: ${type}`);
    }

    const template = EMAIL_TEMPLATES[type as keyof EmailTemplate];

    const emailPayload = {
      from: "Cureliah <noreply@cureliah.com>",
      to: [to],
      subject: template.subject,
      html: template.template(data),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Email sending failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
