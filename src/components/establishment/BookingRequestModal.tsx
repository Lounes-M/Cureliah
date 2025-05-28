
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';

interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  experience_years?: number;
}

interface VacationWithDoctor extends VacationPost {
  doctor_info: DoctorInfo | null;
}

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacation: VacationWithDoctor;
  onSuccess: () => void;
}

const BookingRequestModal = ({ isOpen, onClose, vacation, onSuccess }: BookingRequestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateTotalAmount = () => {
    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const hoursPerDay = 8; // Estimation de 8h par jour
    return days * hoursPerDay * vacation.hourly_rate;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une demande",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotalAmount();

      const { error } = await supabase
        .from('vacation_bookings')
        .insert({
          vacation_post_id: vacation.id,
          doctor_id: vacation.doctor_id,
          establishment_id: user.id,
          message: message || null,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending'
        });

      if (error) throw error;

      onSuccess();
    } catch (error: any) {
      console.error('Error creating booking request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotalAmount();
  const days = Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Demande de réservation</DialogTitle>
          <DialogDescription>
            Envoyez une demande de réservation pour cette vacation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Détails de la vacation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">{vacation.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Dr. {vacation.doctor_info?.first_name} {vacation.doctor_info?.last_name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span>
                    Du {new Date(vacation.start_date).toLocaleDateString('fr-FR')} au {new Date(vacation.end_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{vacation.location || 'Localisation à définir'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Euro className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{vacation.hourly_rate}€/heure</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{days} jour{days > 1 ? 's' : ''}</span>
                </div>
                {vacation.speciality && (
                  <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue">
                    {vacation.speciality}
                  </Badge>
                )}
              </div>
            </div>

            {vacation.description && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                <p className="text-gray-600 text-sm">{vacation.description}</p>
              </div>
            )}

            {vacation.requirements && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Exigences</h4>
                <p className="text-gray-600 text-sm">{vacation.requirements}</p>
              </div>
            )}
          </div>

          {/* Estimation du coût */}
          <div className="border border-medical-green/20 bg-medical-green/5 p-4 rounded-lg">
            <h4 className="font-semibold text-medical-green mb-2">Estimation du coût total</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Durée estimée:</span>
                <span>{days} jour{days > 1 ? 's' : ''} × 8h/jour = {days * 8}h</span>
              </div>
              <div className="flex justify-between">
                <span>Tarif horaire:</span>
                <span>{vacation.hourly_rate}€/h</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total estimé:</span>
                <span>{totalAmount}€</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              * Estimation basée sur 8h/jour. Le montant final sera confirmé avec le médecin.
            </p>
          </div>

          {/* Message personnel */}
          <div className="space-y-2">
            <Label htmlFor="message">Message pour le médecin (optionnel)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez votre établissement, précisez vos besoins spécifiques, horaires souhaités..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Un message personnalisé augmente vos chances d'obtenir une réponse positive.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-medical-green hover:bg-medical-green-dark"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestModal;
