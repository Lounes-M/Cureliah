
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  senderName: string;
  senderType: 'doctor' | 'establishment';
  timestamp: string;
  isRead?: boolean;
  messageType?: 'text' | 'file' | 'image';
  fileName?: string;
}

const MessageBubble = ({
  content,
  isOwnMessage,
  senderName,
  senderType,
  timestamp,
  isRead = false,
  messageType = 'text',
  fileName
}: MessageBubbleProps) => {
  const getMessageIcon = () => {
    if (messageType === 'file') {
      return <span className="text-xs opacity-75">📎 {fileName}</span>;
    }
    if (messageType === 'image') {
      return <span className="text-xs opacity-75">🖼️ Image</span>;
    }
    return null;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="text-xs">
              {senderType === 'doctor' ? (
                <User className="w-4 h-4" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`space-y-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
          {!isOwnMessage && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">{senderName}</span>
              <Badge variant="outline" className="text-xs">
                {senderType === 'doctor' ? 'Médecin' : 'Établissement'}
              </Badge>
            </div>
          )}
          
          <div
            className={`rounded-lg px-3 py-2 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {getMessageIcon()}
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
            
            <div className={`flex items-center justify-between mt-1 space-x-2 ${
              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            }`}>
              <span
                className={`text-xs ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatDistanceToNow(new Date(timestamp), {
                  addSuffix: true,
                  locale: fr
                })}
              </span>
              
              {isOwnMessage && (
                <div className="flex items-center">
                  {isRead ? (
                    <CheckCheck className="w-3 h-3 text-blue-200" />
                  ) : (
                    <Check className="w-3 h-3 text-blue-300" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isOwnMessage && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="text-xs">
              {senderType === 'doctor' ? (
                <User className="w-4 h-4" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
