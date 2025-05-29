
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: Array<{
    id: string;
    name: string;
  }>;
  bookingId?: string;
}

interface ConversationsListProps {
  onConversationSelect: (conversationId: string, conversations: Conversation[]) => void;
  selectedConversationId?: string;
}

const ConversationsList = ({ onConversationSelect, selectedConversationId }: ConversationsListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      console.log('Fetching conversations for user:', user.id);
      
      // Get bookings where user is involved (as establishment or doctor)
      const { data: bookings, error: bookingsError } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          doctor_id,
          establishment_id,
          created_at,
          vacation_post:vacation_posts(
            title
          )
        `)
        .or(`doctor_id.eq.${user.id},establishment_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      if (!bookings || bookings.length === 0) {
        console.log('No bookings found');
        setConversations([]);
        return;
      }

      // Get conversations based on bookings
      const conversationsData = await Promise.all(
        bookings.map(async (booking: any) => {
          // Determine the other user
          const otherUserId = booking.doctor_id === user.id ? booking.establishment_id : booking.doctor_id;
          
          // Get other user profile
          const { data: otherUserProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', otherUserId)
            .single();

          // Get latest message for this booking
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread message count
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

      console.log('Conversations loaded:', conversationsData);
      setConversations(conversationsData);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId, conversations);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Conversations ({conversations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucune conversation</p>
            <p className="text-sm text-gray-500 mt-2">
              Les conversations apparaîtront ici une fois que vous aurez des réservations actives.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "default" : "outline"}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <User className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conversation.name}</p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 flex-shrink-0">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(conversation.lastMessageTime).toLocaleDateString('fr-FR')}
                    </p>
                    {conversation.participants.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Avec: {conversation.participants.map(p => p.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
