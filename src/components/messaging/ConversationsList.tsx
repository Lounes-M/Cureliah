
import { Card, CardContent } from '@/components/ui/card';
import { useConversations } from '@/hooks/useConversations';
import ConversationsHeader from './ConversationsHeader';
import ConversationsEmptyState from './ConversationsEmptyState';
import ConversationsLoadingState from './ConversationsLoadingState';
import ConversationItem from './ConversationItem';

interface ConversationsListProps {
  onConversationSelect: (conversationId: string, conversations: any[]) => void;
  selectedConversationId?: string;
}

const ConversationsList = ({ onConversationSelect, selectedConversationId }: ConversationsListProps) => {
  const { conversations, loading } = useConversations();

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId, conversations);
  };

  if (loading) {
    return <ConversationsLoadingState />;
  }

  return (
    <Card>
      <ConversationsHeader conversationCount={conversations.length} />
      <CardContent>
        {conversations.length === 0 ? (
          <ConversationsEmptyState />
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={handleConversationClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
