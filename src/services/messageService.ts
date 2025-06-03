import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  booking_id?: string;
  vacation_id?: string;
  conversation_id?: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    role: 'doctor' | 'establishment';
    profile_picture_url?: string;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    role: 'doctor' | 'establishment';
    profile_picture_url?: string;
  };
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: 'doctor' | 'establishment';
    profile_picture_url?: string;
  }[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  bookingId?: string,
  vacationId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          booking_id: bookingId,
          vacation_id: vacationId
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update conversation
    await updateConversation(senderId, receiverId, data);

    return data;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getConversations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants (
          user:profiles (
            id,
            first_name,
            last_name,
            role,
            profile_picture_url
          )
        ),
        last_message:messages (
          id,
          content,
          created_at,
          read
        )
      `)
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(conversation => ({
      id: conversation.id,
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        name: `${p.user.first_name} ${p.user.last_name}`,
        role: p.user.role,
        profile_picture_url: p.user.profile_picture_url
      })),
      last_message: conversation.last_message?.[0],
      unread_count: conversation.unread_count,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at
    }));
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const getMessages = async (conversationId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          first_name,
          last_name,
          role,
          profile_picture_url
        ),
        receiver:profiles!messages_receiver_id_fkey (
          id,
          first_name,
          last_name,
          role,
          profile_picture_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await markMessagesAsRead(conversationId, userId);

    return data;
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;

    // Update conversation unread count
    await supabase.rpc('update_conversation_unread_count', {
      p_conversation_id: conversationId
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

export const createConversation = async (participantIds: string[]) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          participant_ids: participantIds
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Create conversation participants
    await Promise.all(
      participantIds.map(userId =>
        supabase
          .from('conversation_participants')
          .insert([
            {
              conversation_id: data.id,
              user_id: userId
            }
          ])
      )
    );

    return data;
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const updateConversation = async (senderId: string, receiverId: string, message: Message) => {
  try {
    // Get or create conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [senderId, receiverId])
      .single();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      const { data: newConversation } = await createConversation([senderId, receiverId]);
      conversationId = newConversation.id;
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Update unread count
    await supabase.rpc('increment_conversation_unread_count', {
      p_conversation_id: conversationId
    });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  userId: string,
  callback: (message: Message) => void
) => {
  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}; 