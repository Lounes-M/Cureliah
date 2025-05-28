
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MessagingInterface from './MessagingInterface';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  receiverId: string;
  receiverName: string;
  receiverType: 'doctor' | 'establishment';
}

const MessagingModal = ({
  isOpen,
  onClose,
  bookingId,
  receiverId,
  receiverName,
  receiverType
}: MessagingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Messagerie</DialogTitle>
        </DialogHeader>
        <MessagingInterface
          bookingId={bookingId}
          receiverId={receiverId}
          receiverName={receiverName}
          receiverType={receiverType}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
