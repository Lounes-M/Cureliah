
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User, Building2, Check, CheckCheck, Paperclip, Image, File } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useUserPresence } from '@/hooks/useUserPresence';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface MessagingInterfaceProps {
  bookingId: string;
  receiverId: string;
  receiverName: string;
  receiverType: 'doctor' | 'establishment';
}

const MessagingInterface = ({ 
  bookingId, 
  receiverId, 
  receiverName, 
  receiverType 
}: MessagingInterfaceProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markMessageAsRead } = useMessages(bookingId);
  const { getUserStatus } = useUserPresence();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== user?.id && !msg.read_at
    );
    
    unreadMessages.forEach(msg => {
      markMessageAsRead(msg.id);
    });
  }, [messages, user?.id, markMessageAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage, receiverId);
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('message-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-files')
        .getPublicUrl(fileName);

      // Send message with file attachment
      const messageText = `[File: ${file.name}]`;
      const success = await sendMessage(messageText, receiverId, {
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size
      });

      if (success) {
        toast({
          title: "Succès",
          description: "Fichier envoyé avec succès"
        });
      }
    } catch (error: any) {
      logger.error('File upload error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le fichier",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const receiverStatus = getUserStatus(receiverId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-blue"></div>
        <span className="ml-2">Chargement des messages...</span>
      </div>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {receiverType === 'doctor' ? (
            <User className="w-5 h-5 text-medical-blue" />
          ) : (
            <Building2 className="w-5 h-5 text-medical-green" />
          )}
          <span>Conversation avec {receiverName}</span>
          <Badge variant="outline">
            {receiverType === 'doctor' ? 'Médecin' : 'Établissement'}
          </Badge>
          <OnlineStatusIndicator status={receiverStatus} showText />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === user?.id
                      ? 'bg-medical-blue text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.message_type === 'file' && message.file_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {message.file_type?.startsWith('image/') ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <File className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{message.file_name}</span>
                      </div>
                      {message.file_type?.startsWith('image/') ? (
                        <div className="max-w-xs">
                          <img
                            src={message.file_url}
                            alt={message.file_name}
                            className="rounded-lg max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(message.file_url, '_blank')}
                          />
                        </div>
                      ) : (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-medical-blue-light hover:bg-blue-400'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <File className="w-4 h-4" />
                          <span className="text-sm">Télécharger</span>
                        </a>
                      )}
                      {message.content && message.content !== `[File: ${message.file_name}]` && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs ${
                        message.sender_id === user?.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                    {message.sender_id === user?.id && (
                      <div className="flex items-center space-x-1">
                        {message.read_at ? (
                          <CheckCheck className="w-3 h-3 text-blue-200" />
                        ) : (
                          <Check className="w-3 h-3 text-blue-300" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf,text/plain"
            style={{ display: 'none' }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="self-end"
          >
            {uploadingFile ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="self-end"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagingInterface;
