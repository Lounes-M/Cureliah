
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import MessagingModal from '../MessagingModal';

interface QuickMessageButtonProps {
  bookingId: string;
  receiverId: string;
  receiverName: string;
  receiverType: 'doctor' | 'establishment';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const QuickMessageButton = ({
  bookingId,
  receiverId,
  receiverName,
  receiverType,
  variant = 'outline',
  size = 'sm',
  className = ''
}: QuickMessageButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Message
      </Button>

      <MessagingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingId={bookingId}
        receiverId={receiverId}
        receiverName={receiverName}
        receiverType={receiverType}
      />
    </>
  );
};

export default QuickMessageButton;
