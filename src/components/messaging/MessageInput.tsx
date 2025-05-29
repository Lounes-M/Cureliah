
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Tapez votre message..." 
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t p-4 bg-white">
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || sending}
            className="p-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || sending}
            className="p-2"
          >
            <Image className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || sending}
            size="sm"
            className="px-3"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
