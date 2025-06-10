import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Archive } from 'lucide-react';
import { Conversation } from '@/hooks/useConversations';

interface ConversationItemProps {
  conversation: Conversation; // Utiliser le type mis à jour
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
}

const ConversationItem = ({ conversation, isSelected, onSelect }: ConversationItemProps) => {
  // Fonction pour obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'active': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`
          w-full justify-start text-left h-auto p-3 transition-all duration-200
          ${!conversation.isActive 
            ? 'opacity-60 hover:opacity-80 bg-gray-50 border-gray-200' 
            : ''
          }
          ${isSelected && !conversation.isActive
            ? 'bg-gray-200 border-gray-300'
            : ''
          }
        `}
        onClick={() => onSelect(conversation.id)}
      >
        <div className="flex items-center space-x-3 w-full">
          {/* Icône utilisateur avec effet grisé pour les archivées */}
          <div className="relative">
            <User className={`
              w-8 h-8 flex-shrink-0
              ${conversation.isActive 
                ? 'text-gray-400' 
                : 'text-gray-300'
              }
            `} />
            
            {/* Petite icône d'archive pour les conversations inactives */}
            {!conversation.isActive && (
              <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-0.5">
                <Archive className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Nom et badges */}
            <div className="flex items-center justify-between mb-1">
              <p className={`
                font-medium truncate
                ${conversation.isActive ? 'text-gray-900' : 'text-gray-600'}
              `}>
                {conversation.name}
              </p>
              
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {/* Badge de statut */}
                <Badge 
                  variant="outline" 
                  className={`
                    text-xs px-1.5 py-0.5 border
                    ${getStatusColor(conversation.bookingStatus)}
                    ${!conversation.isActive ? 'opacity-70' : ''}
                  `}
                >
                  {getStatusLabel(conversation.bookingStatus)}
                </Badge>
                
                {/* Badge de messages non lus (seulement pour les conversations actives) */}
                {conversation.unreadCount > 0 && conversation.isActive && (
                  <Badge variant="destructive" className="animate-pulse">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Dernier message */}
            <p className={`
              text-sm truncate
              ${conversation.isActive ? 'text-gray-600' : 'text-gray-500'}
            `}>
              {conversation.lastMessage}
            </p>

            {/* Date */}
            <p className={`
              text-xs
              ${conversation.isActive ? 'text-gray-400' : 'text-gray-400'}
            `}>
              {new Date(conversation.lastMessageTime).toLocaleDateString('fr-FR')}
            </p>

            {/* Participants */}
            {conversation.participants.length > 0 && (
              <p className={`
                text-xs
                ${conversation.isActive ? 'text-gray-500' : 'text-gray-400'}
              `}>
                Avec: {conversation.participants.map(p => p.name).join(', ')}
              </p>
            )}

            {/* Indicateur d'archivage pour les conversations inactives */}
            {!conversation.isActive && (
              <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-200 border-dashed">
                <Archive className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Conversation archivée</span>
              </div>
            )}
          </div>
        </div>
      </Button>
    </div>
  );
};

export default ConversationItem;