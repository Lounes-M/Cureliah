
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import ConversationsList from './ConversationsList';
import MessagingInterface from '../MessagingInterface';

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

const MessagingCenter = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedBookingId={selectedConversation?.booking_id}
        />
      </div>

      {/* Message Interface */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <MessagingInterface
            bookingId={selectedConversation.booking_id}
            receiverId={selectedConversation.other_user_id}
            receiverName={selectedConversation.other_user_name}
            receiverType={selectedConversation.other_user_type}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
              <p className="text-sm text-center">
                Choisissez une conversation dans la liste pour commencer à échanger des messages
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessagingCenter;
