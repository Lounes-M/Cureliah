
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, XCircle, Star, MessageCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VacationStatus } from '@/types/database';

interface BookingStatusWorkflowProps {
  bookingId: string;
  currentStatus: VacationStatus;
  userType: 'doctor' | 'establishment';
  partnerId: string;
  partnerName: string;
  onStatusUpdate: () => void;
}

const BookingStatusWorkflow = ({
  bookingId,
  currentStatus,
  userType,
  partnerId,
  partnerName,
  onStatusUpdate
}: BookingStatusWorkflowProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | 'complete'>('confirm');

  const updateBookingStatus = async (newStatus: VacationStatus, reason?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Create notification for the other party
      const notificationMessage = getNotificationMessage(newStatus, userType, reason);
      await supabase.from('notifications').insert({
        user_id: partnerId,
        title: 'Mise à jour de réservation',
        message: notificationMessage,
        type: newStatus === 'cancelled' ? 'warning' : 'info',
        related_booking_id: bookingId
      });

      toast({
        title: "Statut mis à jour",
        description: getSuccessMessage(newStatus),
      });

      onStatusUpdate();
      setConfirmationOpen(false);
      setCancellationReason('');
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationMessage = (status: VacationStatus, senderType: string, reason?: string) => {
    const senderLabel = senderType === 'doctor' ? 'Le médecin' : "L'établissement";
    
    switch (status) {
      case 'booked':
        return `${senderLabel} a accepté votre demande de réservation.`;
      case 'cancelled':
        return `${senderLabel} a annulé la réservation.${reason ? ` Raison: ${reason}` : ''}`;
      case 'completed':
        return `${senderLabel} a marqué la vacation comme terminée.`;
      default:
        return 'Le statut de votre réservation a été mis à jour.';
    }
  };

  const getSuccessMessage = (status: VacationStatus) => {
    switch (status) {
      case 'booked': return 'Réservation confirmée avec succès';
      case 'cancelled': return 'Réservation annulée';
      case 'completed': return 'Vacation marquée comme terminée';
      default: return 'Statut mis à jour';
    }
  };

  const getStatusInfo = (status: VacationStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'En attente'
        };
      case 'booked':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Confirmée'
        };
      case 'completed':
        return {
          icon: <Star className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-800',
          label: 'Terminée'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Annulée'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: status
        };
    }
  };

  const statusInfo = getStatusInfo(currentStatus);

  const handleAction = (action: 'confirm' | 'cancel' | 'complete') => {
    setActionType(action);
    if (action === 'cancel') {
      setConfirmationOpen(true);
    } else {
      setConfirmationOpen(true);
    }
  };

  const executeAction = () => {
    switch (actionType) {
      case 'confirm':
        updateBookingStatus('booked');
        break;
      case 'cancel':
        updateBookingStatus('cancelled', cancellationReason);
        break;
      case 'complete':
        updateBookingStatus('completed');
        break;
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'confirm': return 'Confirmer la réservation';
      case 'cancel': return 'Annuler la réservation';
      case 'complete': return 'Marquer comme terminée';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'confirm': return 'Êtes-vous sûr de vouloir confirmer cette réservation ?';
      case 'cancel': return 'Êtes-vous sûr de vouloir annuler cette réservation ?';
      case 'complete': return 'Êtes-vous sûr de vouloir marquer cette vacation comme terminée ?';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {statusInfo.icon}
          <span>Gestion de la réservation</span>
        </CardTitle>
        <CardDescription>
          Gérez le statut et le workflow de cette réservation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium">Statut actuel:</span>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Actions based on current status and user type */}
        {currentStatus === 'pending' && userType === 'doctor' && (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleAction('confirm')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepter
            </Button>
            <Button
              onClick={() => handleAction('cancel')}
              disabled={loading}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
          </div>
        )}

        {currentStatus === 'booked' && (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleAction('complete')}
              disabled={loading}
              variant="outline"
            >
              <Star className="w-4 h-4 mr-2" />
              Marquer comme terminée
            </Button>
            <Button
              onClick={() => handleAction('cancel')}
              disabled={loading}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        )}

        {currentStatus === 'pending' && userType === 'establishment' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <Clock className="w-4 h-4 inline mr-1" />
              En attente de confirmation du médecin
            </p>
          </div>
        )}

        {currentStatus === 'cancelled' && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              <XCircle className="w-4 h-4 inline mr-1" />
              Cette réservation a été annulée
            </p>
          </div>
        )}

        {currentStatus === 'completed' && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Vacation terminée avec succès
            </p>
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getActionTitle()}</DialogTitle>
              <DialogDescription>
                {getActionDescription()}
              </DialogDescription>
            </DialogHeader>
            
            {actionType === 'cancel' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Raison de l'annulation (optionnel)</label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous annulez cette réservation..."
                  rows={3}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmationOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={executeAction}
                disabled={loading}
                className={actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {loading ? 'Traitement...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BookingStatusWorkflow;
