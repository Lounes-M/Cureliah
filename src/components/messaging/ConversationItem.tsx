
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface ConversationItemProps {
  conversation: {
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
  };
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
}

const ConversationItem = ({ conversation, isSelected, onSelect }: ConversationItemProps) => {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="w-full justify-start text-left h-auto p-3"
      onClick={() => onSelect(conversation.id)}
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
  );
};

export default ConversationItem;
