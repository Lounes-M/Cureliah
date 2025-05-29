
import { MessageCircle } from 'lucide-react';

const ConversationsEmptyState = () => {
  return (
    <div className="text-center py-8">
      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600">Aucune conversation</p>
      <p className="text-sm text-gray-500 mt-2">
        Les conversations apparaîtront ici une fois que vous aurez des réservations actives.
      </p>
    </div>
  );
};

export default ConversationsEmptyState;
