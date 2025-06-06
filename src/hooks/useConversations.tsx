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
      console.log('🔍 Fetching conversations for user:', user.id);

      // CORRECTION : Utiliser la table 'bookings' au lieu de 'vacation_bookings'
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          doctor_id,
          establishment_id,
          created_at,
          vacation_posts!inner(
            title,
            location
          )
        `)
        .or(`doctor_id.eq.${user.id},establishment_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('📋 Found bookings:', bookings?.length || 0);

      if (!bookings || bookings.length === 0) {
        setConversations([]);
        return;
      }

      // Transform bookings to conversations
      const conversationsData = await Promise.all(
        bookings.map(async (booking: any) => {
          const isDoctor = booking.doctor_id === user.id;
          const otherUserId = isDoctor ? booking.establishment_id : booking.doctor_id;
          
          console.log(`👤 Getting profile for ${isDoctor ? 'establishment' : 'doctor'}:`, otherUserId);

          // Get other user profile based on type
          let otherUserProfile = null;
          
          if (isDoctor) {
            // User is doctor, get establishment profile
            const { data: establishmentProfile } = await supabase
              .from('establishment_profiles')
              .select('name')
              .eq('id', otherUserId)
              .single();
            
            if (establishmentProfile) {
              otherUserProfile = { name: establishmentProfile.name };
            }
          } else {
            // User is establishment, get doctor profile
            const { data: doctorProfile } = await supabase
              .from('doctor_profiles')
              .select('first_name, last_name')
              .eq('id', otherUserId)
              .single();
            
            if (doctorProfile) {
              otherUserProfile = { 
                name: `Dr ${doctorProfile.first_name || ''} ${doctorProfile.last_name || ''}`.trim() 
              };
            }
          }

          // Fallback to general profiles table
          if (!otherUserProfile) {
            const { data: generalProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', otherUserId)
              .single();

            if (generalProfile) {
              otherUserProfile = { 
                name: `${generalProfile.first_name || ''} ${generalProfile.last_name || ''}`.trim() || 'Utilisateur'
              };
            }
          }

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

          const otherUserName = otherUserProfile?.name || 'Utilisateur';
          const conversationName = `${booking.vacation_posts?.title || 'Vacation'} - ${otherUserName}`;

          console.log(`💬 Created conversation: ${conversationName}`);

          return {
            id: booking.id,
            name: conversationName,
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

      console.log('✅ Final conversations:', conversationsData.length);
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