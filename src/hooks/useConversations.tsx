
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ConversationParticipant {
  id: string;
  name: string;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: ConversationParticipant[];
  bookingId?: string;
}

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          doctor_id,
          establishment_id,
          created_at,
          vacation_post:vacation_posts(title)
        `)
        .or(`doctor_id.eq.${user.id},establishment_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setConversations([]);
        return;
      }

      // Transform bookings to conversations
      const conversationsData = await Promise.all(
        bookings.map(async (booking: any) => {
          const otherUserId = booking.doctor_id === user.id ? booking.establishment_id : booking.doctor_id;
          
          // Get other user profile
          const { data: otherUserProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', otherUserId)
            .single();

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', booking.id)
            .eq('receiver_id', user.id)
            .is('read_at', null);

          const otherUserName = otherUserProfile 
            ? `${otherUserProfile.first_name || ''} ${otherUserProfile.last_name || ''}`.trim() || 'Utilisateur'
            : 'Utilisateur';

          return {
            id: booking.id,
            name: booking.vacation_post?.title || 'Conversation',
            lastMessage: latestMessage?.content || 'Aucun message',
            lastMessageTime: latestMessage?.created_at || booking.created_at,
            unreadCount: unreadCount || 0,
            participants: [{
              id: otherUserId,
              name: otherUserName
            }],
            bookingId: booking.id
          };
        })
      );

      setConversations(conversationsData);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    conversations,
    loading,
    refetch: fetchConversations
  };
}
