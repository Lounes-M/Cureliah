
import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Image } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image';
  file_url?: string;
  file_name?: string;
  read_at?: string;
  created_at: string;
  sender_profile?: {
    first_name?: string;
    last_name?: string;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  otherUserName?: string;
}

const MessageList = ({ messages, currentUserId, otherUserName }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {isOwnMessage 
                      ? currentUserId?.charAt(0).toUpperCase()
                      : otherUserName?.charAt(0).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-lg px-3 py-2 ${
                  isOwnMessage 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-center space-x-2">
                    {getMessageIcon(message.message_type)}
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.file_name && (
                    <p className="text-xs opacity-75 mt-1">{message.file_name}</p>
                  )}
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
