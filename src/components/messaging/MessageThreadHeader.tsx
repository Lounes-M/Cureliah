
import { CardHeader, CardTitle } from '@/components/ui/card';

interface MessageThreadHeaderProps {
  otherUserName?: string;
}

const MessageThreadHeader = ({ otherUserName }: MessageThreadHeaderProps) => {
  return (
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">
        Conversation avec {otherUserName || 'Utilisateur'}
      </CardTitle>
    </CardHeader>
  );
};

export default MessageThreadHeader;
