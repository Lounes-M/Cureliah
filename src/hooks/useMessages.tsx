
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageWithSender extends Message {
  sender_profile?: {
    first_name?: string;
    last_name?: string;
    user_type: string;
  };
}

export function useMessages(bookingId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !user) return;

    fetchMessages();
    
    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only show toast if message is from someone else
          if (newMessage.sender_id !== user.id) {
            setMessages(prev => [...prev, newMessage]);
            toast({
              title: "Nouveau message",
              description: "Vous avez reçu un nouveau message",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, user]);

  const fetchMessages = async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data as MessageWithSender[] || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, receiverId: string) => {
    if (!bookingId || !user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: 'text'
        })
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            first_name,
            last_name,
            user_type
          )
        `)
        .single();

      if (error) throw error;

      // Add message to local state immediately for the sender
      setMessages(prev => [...prev, data as MessageWithSender]);
      
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
      return false;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('mark_message_read', {
        message_id: messageId
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markMessageAsRead,
    refetch: fetchMessages
  };
}
