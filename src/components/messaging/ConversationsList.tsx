import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useConversations } from '@/hooks/useConversations';
import ConversationItem from './ConversationItem';
import { MessageSquare, RefreshCw, Archive, Activity, Loader2 } from 'lucide-react';

interface ConversationsListProps {
  onConversationSelect: (conversationId: string, conversations: any[]) => void;
  selectedConversationId?: string;
}

const ConversationsList = ({ onConversationSelect, selectedConversationId }: ConversationsListProps) => {
  const { conversations, loading, refetch } = useConversations();

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId, conversations);
  };

  // Séparer les conversations actives et archivées
  const activeConversations = conversations.filter(conv => conv.isActive);
  const archivedConversations = conversations.filter(conv => !conv.isActive);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <span className="text-sm text-gray-600">Chargement des conversations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span>Conversations</span>
          <Badge variant="secondary" className="ml-1">
            {conversations.length}
          </Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-medium">Aucune conversation</div>
              <div className="text-xs mt-1">
                Les conversations apparaîtront ici quand vous aurez des réservations avec des messages échangés
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {/* Section des conversations actives */}
              {activeConversations.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
                      Conversations actives
                    </span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {activeConversations.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {activeConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={handleConversationClick}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Séparateur si on a les deux types */}
              {activeConversations.length > 0 && archivedConversations.length > 0 && (
                <div className="py-3">
                  <Separator className="bg-gray-200" />
                </div>
              )}

              {/* Section des conversations archivées */}
              {archivedConversations.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Archive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-500">
                      Conversations archivées
                    </span>
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                      {archivedConversations.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {archivedConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={handleConversationClick}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationsList;