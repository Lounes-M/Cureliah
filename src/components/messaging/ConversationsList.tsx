
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
}

interface ConversationsListProps {
  onConversationSelect: (conversationId: string) => void;
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
      
      // Get all chat groups where the user is a member
      const { data: groupMemberships, error: membershipError } = await supabase
        .from('chat_group_members')
        .select(`
          group_id,
          chat_groups (
            id,
            name,
            description,
            booking_id,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching group memberships:', membershipError);
        throw membershipError;
      }

      if (!groupMemberships || groupMemberships.length === 0) {
        console.log('No group memberships found');
        setConversations([]);
        return;
      }

      // Get the latest message for each group and unread count
      const conversationsData = await Promise.all(
        groupMemberships.map(async (membership: any) => {
          const group = membership.chat_groups;
          if (!group) return null;

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread message count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('receiver_id', user.id)
            .is('read_at', null);

          // Get other participants in the group
          const { data: otherMembers } = await supabase
            .from('chat_group_members')
            .select(`
              user_id,
              profiles (
                first_name,
                last_name
              )
            `)
            .eq('group_id', group.id)
            .neq('user_id', user.id);

          const participants = otherMembers?.map((member: any) => ({
            id: member.user_id,
            name: `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.trim() || 'Utilisateur'
          })) || [];

          return {
            id: group.id,
            name: group.name || 'Conversation',
            lastMessage: latestMessage?.content || 'Aucun message',
            lastMessageTime: latestMessage?.created_at || group.created_at,
            unreadCount: unreadCount || 0,
            participants
          };
        })
      );

      const validConversations = conversationsData.filter(Boolean) as Conversation[];
      console.log('Conversations loaded:', validConversations);
      setConversations(validConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
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
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "default" : "outline"}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <User className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conversation.name}</p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
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
