import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import ConversationsList from './ConversationsList';
import MessagingInterface from '../MessagingInterface';
import { Conversation } from '@/hooks/useConversations';

interface MessagingCenterProps {
  autoOpenDoctorId?: string;
  autoOpenDoctorName?: string;
  autoOpenBookingId?: string;
}

const MessagingCenter = ({ 
  autoOpenDoctorId, 
  autoOpenDoctorName, 
  autoOpenBookingId 
}: MessagingCenterProps) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversationId: string, conversations: Conversation[]) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  };

  // Gérer l'ouverture automatique d'une conversation
  useEffect(() => {
    if (autoOpenDoctorId && autoOpenDoctorName) {
      console.log('🚀 Auto-opening conversation with:', autoOpenDoctorName);
      
      // Créer une conversation temporaire pour l'auto-ouverture
      const autoConversation: Conversation = {
        id: autoOpenDoctorId,
        name: autoOpenDoctorName,
        lastMessage: "Nouvelle conversation",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        participants: [{
          id: autoOpenDoctorId,
          name: autoOpenDoctorName
        }],
        bookingId: autoOpenBookingId || autoOpenDoctorId,
        bookingStatus: 'pending', // valeur par défaut
        isActive: true, // valeur par défaut
      };
      
      setSelectedConversation(autoConversation);
    }
  }, [autoOpenDoctorId, autoOpenDoctorName, autoOpenBookingId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <ConversationsList
          onConversationSelect={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
        />
      </div>

      {/* Message Interface */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <MessagingInterface
            bookingId={selectedConversation.bookingId || selectedConversation.id}
            receiverId={selectedConversation.participants[0]?.id || ''}
            receiverName={selectedConversation.participants[0]?.name || selectedConversation.name}
            receiverType="doctor"
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