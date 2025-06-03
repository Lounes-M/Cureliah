import { supabase } from '@/integrations/supabase/client';
import { VacationPost, NotificationPreferences } from '@/types/database';

interface EmailTemplate {
  subject: string;
  body: string;
}

const getVacationReminderTemplate = (vacation: VacationPost): EmailTemplate => ({
  subject: `Rappel : Vacation à venir - ${vacation.title}`,
  body: `
    Bonjour,
    
    Nous vous rappelons que vous avez une vacation programmée :
    
    Titre : ${vacation.title}
    Spécialité : ${vacation.speciality}
    Date de début : ${new Date(vacation.start_date).toLocaleDateString()}
    Date de fin : ${new Date(vacation.end_date).toLocaleDateString()}
    Lieu : ${vacation.location}
    
    N'oubliez pas de vous préparer pour cette vacation.
    
    Cordialement,
    L'équipe Med-Vacant-Connect
  `
});

const getBookingUpdateTemplate = (booking: any): EmailTemplate => ({
  subject: `Mise à jour de réservation - ${booking.vacation_title}`,
  body: `
    Bonjour,
    
    Le statut de votre réservation a été mis à jour :
    
    Vacation : ${booking.vacation_title}
    Nouveau statut : ${booking.status}
    Date : ${new Date(booking.updated_at).toLocaleDateString()}
    
    Vous pouvez consulter les détails dans votre espace personnel.
    
    Cordialement,
    L'équipe Med-Vacant-Connect
  `
});

const getNewMessageTemplate = (message: any): EmailTemplate => ({
  subject: `Nouveau message reçu`,
  body: `
    Bonjour,
    
    Vous avez reçu un nouveau message concernant la vacation "${message.vacation_title}".
    
    Expéditeur : ${message.sender_name}
    Message : ${message.content}
    
    Vous pouvez répondre directement depuis votre espace personnel.
    
    Cordialement,
    L'équipe Med-Vacant-Connect
  `
});

export const sendVacationReminder = async (vacation: VacationPost, preferences: NotificationPreferences) => {
  if (preferences.email_frequency === 'never') return;

  const template = getVacationReminderTemplate(vacation);
  
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: vacation.doctor_email,
        subject: template.subject,
        text: template.body
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending vacation reminder email:', error);
  }
};

export const sendBookingUpdate = async (booking: any, preferences: NotificationPreferences) => {
  if (!preferences.email_on_booking_update || preferences.email_frequency === 'never') return;

  const template = getBookingUpdateTemplate(booking);
  
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: booking.doctor_email,
        subject: template.subject,
        text: template.body
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending booking update email:', error);
  }
};

export const sendNewMessage = async (message: any, preferences: NotificationPreferences) => {
  if (!preferences.email_on_message || preferences.email_frequency === 'never') return;

  const template = getNewMessageTemplate(message);
  
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: message.receiver_email,
        subject: template.subject,
        text: template.body
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending new message email:', error);
  }
}; 