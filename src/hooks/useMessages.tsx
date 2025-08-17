import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  read_at?: string | null;
}

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
  const [loading, setLoading] = useState<boolean>(true);

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
            // Rechargement complet pour avoir les profils
            fetchMessages();
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
              msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
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
      logger.info('🔍 Fetching messages for booking:', bookingId);
      
      // Requête simple sans jointures problématiques
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('❌ Error fetching messages:', error);
        throw error;
      }

      logger.info('📨 Raw messages found:', messagesData?.length || 0);

      // Si on a des messages, récupérer les profils séparément
      let messagesWithProfiles: MessageWithSender[] = [];

      if (messagesData && messagesData.length > 0) {
        // Récupérer les IDs uniques des expéditeurs
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        logger.info('👤 Fetching profiles for sender IDs:', senderIds);
        
        // Récupérer les profils des expéditeurs
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, user_type')
          .in('id', senderIds);

        if (profilesError) {
          logger.warn('⚠️ Error fetching profiles (continuing anyway);:', profilesError);
        }

        logger.info('👥 Sender profiles found:', profiles?.length || 0);

        // Combiner les messages avec les profils
        messagesWithProfiles = messagesData.map(message => {
          const senderProfile = profiles?.find(p => p.id === message.sender_id);
          return {
            ...message,
            sender_profile: senderProfile ? {
              first_name: senderProfile.first_name || '',
              last_name: senderProfile.last_name || '',
              user_type: senderProfile.user_type
            } : undefined
          };
        });
      }

      setMessages(messagesWithProfiles);
    } catch (error: unknown) {
      logger.error('Error fetching messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, receiverId: string, fileData?: {
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }) => {
    if (!bookingId || !user || !content.trim()) return false;

    try {
      logger.info('📤 Sending message...');
      logger.info('📋 Booking ID:', bookingId);
      logger.info('👤 Receiver ID:', receiverId);
      logger.info('✉️ Content:', content);
      
      // Vérifier d'abord que la réservation existe
      const { data: bookingExists, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !bookingExists) {
        logger.error('❌ Booking not found:', bookingId, bookingError);
        toast({
          title: "Erreur",
          description: `La réservation ${bookingId} n'existe pas dans la base de données`,
          variant: "destructive"
        });
        return false;
      }

      logger.info('✅ Booking exists, proceeding with message insertion...');

      const messageData: any = {
        booking_id: bookingId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        message_type: fileData ? 'file' : 'text'
      };

      if (fileData) {
        messageData.file_url = fileData.file_url;
        messageData.file_name = fileData.file_name;
        messageData.file_type = fileData.file_type;
        messageData.file_size = fileData.file_size;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error inserting message:', error);
        throw error;
      }

      logger.info('✅ Message inserted successfully:', data);

      // Récupérer le profil de l'expéditeur pour l'affichage immédiat
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_type')
        .eq('id', user.id)
        .single();

      // Ajouter le message à l'état local immédiatement pour l'expéditeur
      const messageWithProfile: MessageWithSender = {
        ...data,
        sender_profile: senderProfile ? {
          first_name: senderProfile.first_name || '',
          last_name: senderProfile.last_name || '',
          user_type: senderProfile.user_type
        } : undefined
      };

      setMessages(prev => [...prev, messageWithProfile]);
      
      logger.info('✅ Message sent and added to local state');
      return true;
    } catch (error: unknown) {
      logger.error('💥 Error sending message:', error);
      let errorMessage = "Impossible d'envoyer le message";
      if (typeof error === 'object' && error !== null) {
        if ('code' in error && error.code === '23503') {
          errorMessage = "Erreur de référence : la réservation n'existe plus";
        } else if ('code' in error && error.code === '23505') {
          errorMessage = "Ce message existe déjà";
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        logger.warn('⚠️ Error marking message as read:', error);
        return;
      }

      // Mettre à jour l'état local
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error: unknown) {
      logger.warn('Error marking message as read:', error);
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