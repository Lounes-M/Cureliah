import { useState, useEffect, useCallback } from 'react';
import { UrgentRequestNotification } from '@/types/premium';
import { UrgentNotificationService } from '@/services/urgentNotificationService';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface UseUrgentNotificationsOptions {
  userId: string;
  userType: 'doctor' | 'establishment';
  enableRealtime?: boolean;
  enableToasts?: boolean;
  enableSound?: boolean;
  autoMarkAsRead?: boolean;
}

interface UseUrgentNotificationsResult {
  notifications: UrgentRequestNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const useUrgentNotifications = (
  options: UseUrgentNotificationsOptions
): UseUrgentNotificationsResult => {
  const { userId, userType, enableRealtime = true, enableToasts = true, enableSound = false, autoMarkAsRead = false } = options;
  
  const [notifications, setNotifications] = useState<UrgentRequestNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  // Audio pour les notifications
  const playNotificationSound = useCallback(() => {
    if (enableSound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {
        // Ignorer les erreurs de lecture audio (permissions)
      });
    }
  }, [enableSound]);

  // Charger les notifications initiales
  const loadNotifications = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(!isLoadMore);
      setError(null);

      const currentOffset = isLoadMore ? offset : 0;
      const limit = 20;

      const [notificationsData, unreadCountData] = await Promise.all([
        UrgentNotificationService.getNotifications(userId, userType, {
          offset: currentOffset,
          limit
        }),
        UrgentNotificationService.getUnreadCount(userId, userType)
      ]);

      if (isLoadMore) {
        setNotifications(prev => [...prev, ...notificationsData]);
        setOffset(currentOffset + notificationsData.length);
      } else {
        setNotifications(notificationsData);
        setOffset(notificationsData.length);
      }

      setHasMore(notificationsData.length === limit);
      setUnreadCount(unreadCountData);

    } catch (error: any) {
      logger.error('Erreur lors du chargement des notifications:', error);
      setError(error.message || 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, userType, offset]);

  // Gérer les nouvelles notifications en temps réel
  const handleNewNotification = useCallback((notification: UrgentRequestNotification) => {
    // Ajouter la nouvelle notification en haut de la liste
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });

    // Incrementer le compteur de non lues
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Afficher un toast si activé
    if (enableToasts) {
      const icon = UrgentNotificationService.getNotificationIcon(notification.type);
      toast({
        title: `${icon} ${notification.title}`,
        description: notification.message,
        variant: notification.type === 'request_accepted' ? 'default' : 'default',
      });
    }

    // Jouer un son si activé
    playNotificationSound();

    // Marquer automatiquement comme lue si activé
    if (autoMarkAsRead) {
      setTimeout(() => {
        markAsRead(notification.id);
      }, 3000);
    }
  }, [enableToasts, playNotificationSound, autoMarkAsRead, toast]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await UrgentNotificationService.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      logger.error('Erreur lors du marquage comme lue:', error);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await UrgentNotificationService.markAllNotificationsAsRead(userId, userType);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error: any) {
      logger.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  }, [userId, userType]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await UrgentNotificationService.deleteNotification(notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      logger.error('Erreur lors de la suppression de la notification:', error);
    }
  }, [notifications]);

  // Actualiser les notifications
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await loadNotifications(false);
  }, [loadNotifications]);

  // Charger plus de notifications
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadNotifications(true);
    }
  }, [hasMore, loading, loadNotifications]);

  // Effet pour charger les notifications initiales
  useEffect(() => {
    if (userId && userType) {
      loadNotifications(false);
    }
  }, [userId, userType]);

  // Effet pour s'abonner aux notifications en temps réel
  useEffect(() => {
    if (!enableRealtime || !userId || !userType) return;

    const subscriptionKey = UrgentNotificationService.subscribeToNotifications(
      userId,
      userType,
      handleNewNotification
    );

    // Nettoyer l'abonnement au démontage
    return () => {
      UrgentNotificationService.unsubscribeFromNotifications(userId, userType);
    };
  }, [userId, userType, enableRealtime, handleNewNotification]);

  // Effet pour écouter les événements globaux de notifications
  useEffect(() => {
    const handleGlobalNotification = (event: CustomEvent) => {
      const notification = event.detail as UrgentRequestNotification;
      if (notification.recipient_id === userId && notification.recipient_type === userType) {
        handleNewNotification(notification);
      }
    };

    window.addEventListener('urgentNotification', handleGlobalNotification as EventListener);

    return () => {
      window.removeEventListener('urgentNotification', handleGlobalNotification as EventListener);
    };
  }, [userId, userType, handleNewNotification]);

  // Nettoyer les abonnements lors du démontage
  useEffect(() => {
    return () => {
      UrgentNotificationService.unsubscribeFromAll();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    hasMore
  };
};
