
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VacationStatus } from '@/types/database';
import ReviewForm from './ReviewForm';

interface VacationStatusManagerProps {
  bookingId: string;
  currentStatus: VacationStatus;
  isDoctor: boolean;
  partnerId: string;
  partnerName: string;
  onStatusUpdate: () => void;
}

const VacationStatusManager = ({
  bookingId,
  currentStatus,
  isDoctor,
  partnerId,
  partnerName,
  onStatusUpdate
}: VacationStatusManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const updateStatus = async (newStatus: VacationStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Create notification for the other party
      const notificationData = {
        user_id: partnerId,
        title: 'Statut de vacation mis à jour',
        message: `Le statut de votre vacation a été mis à jour : ${getStatusText(newStatus)}`,
        type: 'info',
        related_booking_id: bookingId
      };

      await supabase.from('notifications').insert(notificationData);

      toast({
        title: "Statut mis à jour",
        description: `Vacation marquée comme ${getStatusText(newStatus).toLowerCase()}`,
      });

      if (newStatus === 'completed') {
        setShowReviewForm(true);
      }

      onStatusUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: VacationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: VacationStatus) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'booked': return 'Confirmée';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusIcon = (status: VacationStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'booked': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (showReviewForm && currentStatus === 'completed') {
    return (
      <ReviewForm
        bookingId={bookingId}
        targetId={partnerId}
        targetName={partnerName}
        isDoctor={!isDoctor}
        onReviewSubmitted={() => setShowReviewForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon(currentStatus)}
          <span>Statut de la vacation</span>
        </CardTitle>
        <CardDescription>
          Gérez l'état de cette vacation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Statut actuel:</span>
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusText(currentStatus)}
          </Badge>
        </div>

        {currentStatus === 'booked' && (
          <div className="flex space-x-2">
            <Button
              onClick={() => updateStatus('completed')}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer comme terminée
            </Button>
            <Button
              onClick={() => updateStatus('cancelled')}
              disabled={loading}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        )}

        {currentStatus === 'completed' && (
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="outline"
            className="w-full"
          >
            <Star className="w-4 h-4 mr-2" />
            Laisser un avis
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VacationStatusManager;
