import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  getConversations,
  getMessages,
  sendMessage,
  subscribeToMessages,
  Conversation,
  Message
} from '@/services/messageService';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';

export const MessageCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToMessages(user.id, handleNewMessage);
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations(user!.id);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId, user!.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleNewMessage = (message: Message) => {
    if (selectedConversation?.id === message.conversation_id) {
      setMessages(prev => [...prev, message]);
    }
    fetchConversations(); // Update conversation list
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const otherParticipant = selectedConversation.participants.find(p => p.id !== user!.id);
      if (!otherParticipant) return;

      await sendMessage(user!.id, otherParticipant.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {conversations.map(conversation => {
              const otherParticipant = conversation.participants.find(p => p.id !== user!.id);
              return (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-lg ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar>
                    <AvatarImage src={otherParticipant?.profile_picture_url} />
                    <AvatarFallback>
                      {otherParticipant?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{otherParticipant?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message?.content}
                    </p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="col-span-8">
        <CardHeader>
          <CardTitle>
            {selectedConversation
              ? selectedConversation.participants.find(p => p.id !== user!.id)?.name
              : 'Select a conversation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 mb-4 ${
                      message.sender_id === user!.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_id !== user!.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={message.sender.profile_picture_url}
                        />
                        <AvatarFallback>
                          {message.sender.first_name[0]}
                          {message.sender.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user!.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                    {message.sender_id === user!.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={message.sender.profile_picture_url}
                        />
                        <AvatarFallback>
                          {message.sender.first_name[0]}
                          {message.sender.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 