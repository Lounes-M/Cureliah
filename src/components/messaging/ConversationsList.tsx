
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle, User, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  booking_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_type: 'doctor' | 'establishment';
  vacation_title: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedBookingId?: string;
}

const ConversationsList = ({ onSelectConversation, selectedBookingId }: ConversationsListProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && profile) {
      fetchConversations();
      subscribeToNewMessages();
    }
  }, [user, profile]);

  const fetchConversations = async () => {
    if (!user || !profile) return;

    try {
      // Get all bookings where the user is involved
      const { data: bookings, error } = await supabase
        .from('vacation_bookings')
        .select(`
          id,
          doctor_id,
          establishment_id,
          vacation_post:vacation_posts!inner(title),
          messages!inner(
            content,
            created_at,
            sender_id,
            read_at
          )
        `)
        .or(`doctor_id.eq.${user.id},establishment_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform bookings into conversations
      const conversationsData: Conversation[] = [];
      
      for (const booking of bookings || []) {
        const otherUserId = booking.doctor_id === user.id ? booking.establishment_id : booking.doctor_id;
        const otherUserType = booking.doctor_id === user.id ? 'establishment' : 'doctor';
        
        // Get other user's profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', otherUserId)
          .single();

        // Get last message and unread count
        const messages = booking.messages || [];
        const lastMessage = messages[messages.length - 1];
        const unreadCount = messages.filter(
          msg => msg.sender_id !== user.id && !msg.read_at
        ).length;

        if (messages.length > 0) {
          conversationsData.push({
            booking_id: booking.id,
            other_user_id: otherUserId,
            other_user_name: otherProfile ? 
              `${otherProfile.first_name} ${otherProfile.last_name}` : 
              'Utilisateur',
            other_user_type: otherUserType,
            vacation_title: Array.isArray(booking.vacation_post) 
              ? booking.vacation_post[0]?.title || 'Vacation'
              : booking.vacation_post?.title || 'Vacation',
            last_message: lastMessage?.content || '',
            last_message_at: lastMessage?.created_at || '',
            unread_count
          });
        }
      }

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

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations(); // Refresh conversations when new message arrives
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.other_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.vacation_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Conversations</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Button
              key={conversation.booking_id}
              variant={selectedBookingId === conversation.booking_id ? "default" : "ghost"}
              className="w-full justify-start p-3 h-auto"
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-start space-x-3 w-full">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {conversation.other_user_type === 'doctor' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {conversation.other_user_name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1 truncate">
                    {conversation.vacation_title}
                  </p>
                  
                  <p className="text-xs text-gray-500 truncate">
                    {conversation.last_message}
                  </p>
                </div>
              </div>
            </Button>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
