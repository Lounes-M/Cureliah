import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export const getMessages = async (userId: string) => {
  try {
    console.log('Fetching messages for user:', userId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database select error:', error);
      throw error;
    }

    console.log('Messages fetched successfully:', data?.length);
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    console.log('Sending message:', { senderId, receiverId, contentLength: content.length });

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Message sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    console.log('Marking message as read:', messageId);

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Message marked as read successfully');
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const getUnreadMessagesCount = async (userId: string) => {
  try {
    console.log('Getting unread messages count for user:', userId);

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Database count error:', error);
      throw error;
    }

    console.log('Unread messages count:', count);
    return count || 0;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    throw error;
  }
}; 