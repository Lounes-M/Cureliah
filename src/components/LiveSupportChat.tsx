import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from '@/services/logger';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  content: string;
  created_at: string;
}

const SUPPORT_EMAIL = 'contact@cureliah.com';

const LiveSupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history from Supabase (for this session)
  useEffect(() => {
    if (!open) return;
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_chat')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(50);
        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        logger.error('Erreur chargement chat support:', err);
      }
    };
    fetchMessages();
    // Optionally: subscribe to new messages in real-time
    const subscription = supabase
      .channel('support_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_chat' }, payload => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message: store in DB, send email
  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      // Store message in DB
      const { data, error } = await supabase
        .from('support_chat')
        .insert([{ sender: 'user', content: input }])
        .select()
        .single();
      if (error) throw error;
      setMessages(prev => [...prev, data]);
      setInput('');
      // Send email to support
      await supabase.functions.invoke('send-support-email', {
        body: {
          to: SUPPORT_EMAIL,
          subject: 'Live Chat Support Message',
          text: input
        }
      });
      toast({ title: 'Message envoyé', description: 'Support informé, réponse sous peu.' });
    } catch (err) {
      logger.error('Erreur envoi message support:', err);
      toast({ title: 'Erreur', description: 'Impossible d’envoyer le message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating bubble bottom left */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg bg-white border-medical-blue hover:bg-medical-blue hover:text-white transition"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat support"
        >
          <MessageCircle className="w-7 h-7" />
        </Button>
      </div>
      {/* Modal chat */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl shadow-2xl border border-medical-blue">
          <div className="flex flex-col h-[420px]">
            <div className="bg-medical-blue text-white px-4 py-3 font-bold text-lg">Support Cureliah</div>
            <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10">Commencez la discussion avec notre équipe support.</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`my-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-medical-blue text-white' : 'bg-white border'}`}>
                    {msg.content}
                    <div className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t bg-white flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                className="resize-none flex-1"
                rows={2}
                disabled={sending}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                variant="default"
                className="h-10"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveSupportChat;
