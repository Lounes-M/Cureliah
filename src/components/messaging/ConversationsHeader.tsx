
import { CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface ConversationsHeaderProps {
  conversationCount: number;
}

const ConversationsHeader = ({ conversationCount }: ConversationsHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Conversations ({conversationCount})
      </CardTitle>
    </CardHeader>
  );
};

export default ConversationsHeader;
