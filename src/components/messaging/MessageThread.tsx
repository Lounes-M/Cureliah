
import { Card, CardContent } from '@/components/ui/card';
import { useMessageThread } from '@/hooks/useMessageThread';
import MessageList from './MessageList';
import MessageThreadHeader from './MessageThreadHeader';
import MessageInput from './MessageInput';

interface MessageThreadProps {
  bookingId: string;
  otherUserId: string;
  otherUserName?: string;
}

const MessageThread = ({ bookingId, otherUserId, otherUserName }: MessageThreadProps) => {
  const { messages, loading, sendMessage, user } = useMessageThread({
    bookingId,
    otherUserId
  });

  if (loading) {
    return <div className="text-center py-8">Chargement des messages...</div>;
  }

  return (
    <Card className="h-96 flex flex-col">
      <MessageThreadHeader otherUserName={otherUserName} />
      <CardContent className="flex-1 flex flex-col min-h-0">
        <MessageList 
          messages={messages}
          currentUserId={user?.id}
          otherUserName={otherUserName}
        />
        <div className="mt-4 pt-4 border-t">
          <MessageInput
            onSendMessage={sendMessage}
            placeholder="Tapez votre message..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageThread;
