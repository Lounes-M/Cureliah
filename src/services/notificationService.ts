import { supabase } from '@/integrations/supabase/client.browser';
import { ErrorHandler } from '@/utils/errorHandler';

export interface CreateNotificationParams<TData = Record<string, unknown>> {
  user_id: string;
  type: 'booking' | 'payment' | 'review' | 'message' | 'system' | 'reminder' | 'document';
  title: string;
  message: string;
  data?: TData;
  priority?: 'low' | 'medium' | 'high';
  scheduled_for?: string;
}

export class NotificationService {
  static async createNotification<TData = Record<string, unknown>>(params: CreateNotificationParams<TData>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: params.user_id,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data,
          priority: params.priority || 'medium',
          scheduled_for: params.scheduled_for,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      ErrorHandler.handleUnexpectedError(error as Error, { userId: params.user_id, type: params.type });
      throw error;
    }
  }

  static async createBulkNotifications<TData = Record<string, unknown>>(notifications: CreateNotificationParams<TData>[]) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications.map(notification => ({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority || 'medium',
          scheduled_for: notification.scheduled_for,
          created_at: new Date().toISOString()
        })));

      if (error) throw error;
      return data;
    } catch (error) {
      ErrorHandler.handleUnexpectedError(error as Error, { notificationCount: notifications.length });
      throw error;
    }
  }

  static async notifyBookingCreated(bookingId: string, doctorId: string, establishmentName: string) {
    return this.createNotification({
      user_id: doctorId,
      type: 'booking',
      title: 'Nouvelle demande de réservation',
      message: `${establishmentName} a fait une demande de réservation`,
      data: { bookingId },
      priority: 'high'
    });
  }

  static async notifyBookingConfirmed(bookingId: string, establishmentId: string, doctorName: string) {
    return this.createNotification({
      user_id: establishmentId,
      type: 'booking',
      title: 'Réservation confirmée',
      message: `Dr. ${doctorName} a confirmé votre réservation`,
      data: { bookingId },
      priority: 'high'
    });
  }

  static async notifyBookingRejected(bookingId: string, establishmentId: string, doctorName: string) {
    return this.createNotification({
      user_id: establishmentId,
      type: 'booking',
      title: 'Réservation rejetée',
      message: `Dr. ${doctorName} a rejeté votre réservation`,
      data: { bookingId },
      priority: 'medium'
    });
  }

  static async notifyPaymentRequired(bookingId: string, userId: string, amount: number) {
    return this.createNotification({
      user_id: userId,
      type: 'payment',
      title: 'Paiement requis',
      message: `Veuillez régler ${amount}€ pour finaliser votre réservation`,
      data: { bookingId, amount },
      priority: 'high'
    });
  }

  static async notifyPaymentReceived(bookingId: string, userId: string, amount: number) {
    return this.createNotification({
      user_id: userId,
      type: 'payment',
      title: 'Paiement reçu',
      message: `Votre paiement de ${amount}€ a été confirmé`,
      data: { bookingId, amount },
      priority: 'medium'
    });
  }

  static async notifyNewMessage(messageId: string, receiverId: string, senderName: string) {
    return this.createNotification({
      user_id: receiverId,
      type: 'message',
      title: 'Nouveau message',
      message: `${senderName} vous a envoyé un message`,
      data: { messageId },
      priority: 'medium'
    });
  }

  static async notifyDocumentUploaded(documentId: string, userId: string, documentName: string) {
    return this.createNotification({
      user_id: userId,
      type: 'document',
      title: 'Document ajouté',
      message: `Le document "${documentName}" a été ajouté à votre profil`,
      data: { documentId },
      priority: 'low'
    });
  }

  static async notifyReviewReceived(reviewId: string, userId: string, rating: number) {
    return this.createNotification({
      user_id: userId,
      type: 'review',
      title: 'Nouveau commentaire',
      message: `Vous avez reçu un nouveau commentaire avec ${rating} étoiles`,
      data: { reviewId },
      priority: 'medium'
    });
  }

  static async notifyUpcomingBooking(bookingId: string, userId: string, startDate: string) {
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 jour avant

    return this.createNotification({
      user_id: userId,
      type: 'reminder',
      title: 'Rappel de réservation',
      message: 'Vous avez une réservation demain',
      data: { bookingId },
      priority: 'medium',
      scheduled_for: reminderDate.toISOString()
    });
  }

  static async notifySystemMaintenance(userIds: string[], maintenanceDate: string) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'system' as const,
      title: 'Maintenance programmée',
      message: `Une maintenance est prévue le ${new Date(maintenanceDate).toLocaleDateString('fr-FR')}`,
      data: { maintenanceDate },
      priority: 'medium' as const
    }));

    return this.createBulkNotifications(notifications);
  }
}
