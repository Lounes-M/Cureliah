import { supabase } from '@/integrations/supabase/client.browser';
import { UrgentRequestNotification } from '@/types/premium';

export class UrgentNotificationService {
  private static subscribers: Map<string, (notification: UrgentRequestNotification) => void> = new Map();
  private static channels: Map<string, any> = new Map();

  // S'abonner aux notifications en temps réel pour un utilisateur
  static subscribeToNotifications(
    userId: string, 
    userType: 'doctor' | 'establishment',
    callback: (notification: UrgentRequestNotification) => void
  ) {
    const channelKey = `${userType}_${userId}`;
    
    // Supprimer l'abonnement existant s'il y en a un
    this.unsubscribeFromNotifications(userId, userType);

    // Créer un nouveau canal Supabase
    const channel = supabase.channel(`urgent_notifications_${channelKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'urgent_request_notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as UrgentRequestNotification;
          if (notification.recipient_type === userType) {
            callback(notification);
            // Émettre aussi un événement global
            this.emitGlobalNotification(notification);
          }
        }
      )
      .subscribe();

    // Stocker les références
    this.subscribers.set(channelKey, callback);
    this.channels.set(channelKey, channel);

    return channelKey;
  }

  // Se désabonner des notifications
  static unsubscribeFromNotifications(userId: string, userType: 'doctor' | 'establishment') {
    const channelKey = `${userType}_${userId}`;
    
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
    
    this.subscribers.delete(channelKey);
  }

  // S'abonner aux nouvelles demandes urgentes (pour les médecins)
  static subscribeToUrgentRequests(
    doctorId: string,
    callback: (request: any) => void
  ) {
    const channelKey = `urgent_requests_${doctorId}`;
    
    // Supprimer l'abonnement existant
    const existingChannel = this.channels.get(channelKey);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // Créer un nouveau canal pour les demandes urgentes
    const channel = supabase.channel(`urgent_requests_doctor_${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'urgent_requests'
        },
        (payload) => {
          const request = payload.new;
          // Filtrer selon la spécialité du médecin si nécessaire
          callback(request);
        }
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channelKey;
  }

  // Émettre une notification globale (pour les toasts, sons, etc.)
  private static emitGlobalNotification(notification: UrgentRequestNotification) {
    // Créer un événement personnalisé
    const event = new CustomEvent('urgentNotification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  // Récupérer les notifications non lues
  static async getUnreadNotifications(
    userId: string, 
    userType: 'doctor' | 'establishment'
  ): Promise<UrgentRequestNotification[]> {
    const { data, error } = await supabase
      .from('urgent_request_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }

    return data || [];
  }

  // Récupérer toutes les notifications avec pagination
  static async getNotifications(
    userId: string, 
    userType: 'doctor' | 'establishment',
    options: {
      offset?: number;
      limit?: number;
      onlyUnread?: boolean;
    } = {}
  ): Promise<UrgentRequestNotification[]> {
    const { offset = 0, limit = 20, onlyUnread = false } = options;

    let query = supabase
      .from('urgent_request_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', userType);

    if (onlyUnread) {
      query = query.eq('read', false);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }

    return data || [];
  }

  // Marquer une notification comme lue
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('urgent_request_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur lors du marquage comme lue:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllNotificationsAsRead(
    userId: string, 
    userType: 'doctor' | 'establishment'
  ): Promise<void> {
    const { error } = await supabase
      .from('urgent_request_notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)
      .eq('read', false);

    if (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      throw error;
    }
  }

  // Supprimer une notification
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('urgent_request_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }

  // Créer une notification manuelle (pour les tests ou cas spéciaux)
  static async createNotification(notification: Omit<UrgentRequestNotification, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('urgent_request_notifications')
      .insert({
        ...notification,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  // Nettoyer les anciennes notifications expirées
  static async cleanupExpiredNotifications(): Promise<void> {
    const { error } = await supabase
      .from('urgent_request_notifications')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Erreur lors du nettoyage des notifications expirées:', error);
    }
  }

  // Obtenir le nombre de notifications non lues
  static async getUnreadCount(
    userId: string, 
    userType: 'doctor' | 'establishment'
  ): Promise<number> {
    const { count, error } = await supabase
      .from('urgent_request_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)
      .eq('read', false);

    if (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }

    return count || 0;
  }

  // Désabonner de tous les canaux (à appeler lors de la déconnexion)
  static unsubscribeFromAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
  }

  // Méthodes utilitaires pour formater les notifications
  static formatNotificationTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}j`;
    return date.toLocaleDateString();
  }

  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'new_request': return '🚨';
      case 'new_response': return '📋';
      case 'request_accepted': return '✅';
      case 'request_cancelled': return '❌';
      case 'reminder': return '⏰';
      default: return '📢';
    }
  }

  static getNotificationColor(type: string): string {
    switch (type) {
      case 'new_request': return 'bg-red-100 border-red-200 text-red-800';
      case 'new_response': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'request_accepted': return 'bg-green-100 border-green-200 text-green-800';
      case 'request_cancelled': return 'bg-gray-100 border-gray-200 text-gray-800';
      case 'reminder': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  }
}
