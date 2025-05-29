
import { Card, CardContent } from '@/components/ui/card';
import ConversationsHeader from './ConversationsHeader';

const ConversationsLoadingState = () => {
  return (
    <Card>
      <ConversationsHeader conversationCount={0} />
      <CardContent>
        <div className="text-center py-4">Chargement...</div>
      </CardContent>
    </Card>
  );
};

export default ConversationsLoadingState;
