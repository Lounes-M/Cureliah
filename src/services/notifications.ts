import { supabase } from '@/integrations/supabase/client.browser';
import { ErrorHandler } from '@/utils/logger';

export type NotificationType = 'message' | 'payment' | 'booking' | 'document' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  data?: any
) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          read: false,
          created_at: new Date().toISOString(),
          data,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return notification;
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { userId, title, type });
    throw error;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { userId });
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { notificationId });
    throw error;
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void
) => {
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};