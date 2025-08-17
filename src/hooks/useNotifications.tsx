import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { Notification } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
          
          // Update unread count when notifications are marked as read
          if (updatedNotification.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      // 👇 AJOUT DE LA GESTION DES SUPPRESSIONS
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.info('🗑️ DELETE event received:', payload, {}, 'Auto', 'todo_replaced');
          const deletedNotification = payload.old as Notification;
          
          setNotifications(prev => {
            logger.info('Before filter:', prev.length, {}, 'Auto', 'todo_replaced');
            const filtered = prev.filter(n => n.id !== deletedNotification.id);
            logger.info('After filter:', filtered.length, {}, 'Auto', 'todo_replaced');
            return filtered;
          });
          
          // Si la notification supprimée n'était pas lue, décrémenter le compteur
          if (!deletedNotification.read_at) {
            setUnreadCount(prev => {
              const newCount = Math.max(0, prev - 1);
              logger.info('Unread count updated:', prev, '->', newCount, {}, 'Auto', 'todo_replaced');
              return newCount;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error: unknown) {
      logger.error('Error fetching notifications:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Note: Real-time subscription will handle the state update
    } catch (error: unknown) {
      logger.error('Error marking notification as read:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      // Note: Real-time subscription will handle the state updates
    } catch (error: unknown) {
      logger.error('Error marking all notifications as read:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive"
      });
    }
  };

  // 👇 NOUVELLE MÉTHODE POUR SUPPRIMER UNE NOTIFICATION
  const deleteNotification = async (notificationId: string) => {
    try {
      // 1. Mettre à jour l'état local IMMÉDIATEMENT (optimistic update)
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // 2. Puis faire la suppression en base
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        // En cas d'erreur, restaurer l'état local
        setNotifications(prev => {
          const updated = [...prev];
          if (notificationToDelete) {
            updated.unshift(notificationToDelete);
          }
          return updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
        
        if (notificationToDelete && !notificationToDelete.read_at) {
          setUnreadCount(prev => prev + 1);
        }
        
        throw error;
      }

      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès"
      });
    } catch (error: unknown) {
      logger.error('Error deleting notification:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification, // 👈 AJOUT DE LA NOUVELLE MÉTHODE
    refetch: fetchNotifications
  };
}