
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Euro, User, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VacationPost, TimeSlot } from '@/types/database';
import { addDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface SelectedSlot {
  date: string;
  timeSlotId: string;
  timeSlot: TimeSlot;
  hours: number;
}

const BookingRequestModal = ({ isOpen, onClose, vacation, onSuccess }: BookingRequestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Charger les créneaux disponibles
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!vacation.id) return;

      try {
        const { data: slots, error } = await supabase
          .from('time_slots')
          .select('*')
          .eq('vacation_id', vacation.id);

        if (error) throw error;
        
        console.log('Loaded time slots:', slots);
        setTimeSlots(slots || []);

        // Générer les dates disponibles entre start_date et end_date
        const startDate = parseISO(vacation.start_date);
        const endDate = parseISO(vacation.end_date);
        const dates = eachDayOfInterval({ start: startDate, end: endDate });
        setAvailableDates(dates.map(date => format(date, 'yyyy-MM-dd')));
        
      } catch (error) {
        console.error('Error fetching time slots:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les créneaux disponibles",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      fetchTimeSlots();
    }
  }, [isOpen, vacation.id]);

  // Calculer les heures pour un créneau
  const calculateSlotHours = (slot: TimeSlot): number => {
    if (slot.type === 'morning') return 4; // 8h-12h
    if (slot.type === 'afternoon') return 4; // 14h-18h
    if (slot.type === 'custom' && slot.start_time && slot.end_time) {
      const start = new Date(`2000-01-01T${slot.start_time}`);
      const end = new Date(`2000-01-01T${slot.end_time}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  };

  // Formater l'affichage d'un créneau
  const formatTimeSlot = (slot: TimeSlot): string => {
    switch (slot.type) {
      case 'morning':
        return 'Matin (8h-12h)';
      case 'afternoon':
        return 'Après-midi (14h-18h)';
      case 'custom':
        return `${slot.start_time} - ${slot.end_time}`;
      default:
        return 'Créneau inconnu';
    }
  };

  // Gérer la sélection d'un créneau
  const handleSlotSelection = (date: string, slot: TimeSlot, checked: boolean) => {
    if (checked) {
      const newSlot: SelectedSlot = {
        date,
        timeSlotId: slot.id,
        timeSlot: slot,
        hours: calculateSlotHours(slot)
      };
      setSelectedSlots([...selectedSlots, newSlot]);
    } else {
      setSelectedSlots(selectedSlots.filter(s => 
        !(s.date === date && s.timeSlotId === slot.id)
      ));
    }
  };

  // Calculer le coût total
  const calculateTotalAmount = (): number => {
    const totalHours = selectedSlots.reduce((sum, slot) => sum + slot.hours, 0);
    return totalHours * vacation.hourly_rate;
  };

  // Vérifier si un créneau est sélectionné
  const isSlotSelected = (date: string, slotId: string): boolean => {
    return selectedSlots.some(s => s.date === date && s.timeSlotId === slotId);
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

    if (selectedSlots.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un créneau",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotalAmount();
      const totalHours = selectedSlots.reduce((sum, slot) => sum + slot.hours, 0);

      // Créer la demande de réservation avec les détails des créneaux
      const bookingData = {
        vacation_post_id: vacation.id,
        doctor_id: vacation.doctor_id,
        establishment_id: user.id,
        message: message || null,
        total_amount: totalAmount,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        selected_slots: selectedSlots.map(slot => ({
          date: slot.date,
          time_slot_id: slot.timeSlotId,
          hours: slot.hours
        }))
      };

      const { data, error } = await supabase
        .from('vacation_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      console.log('Booking request created:', data);

      // Créer une notification pour le médecin
      await supabase
        .from('notifications')
        .insert({
          user_id: vacation.doctor_id,
          title: 'Nouvelle demande de réservation',
          message: `Un établissement souhaite réserver ${totalHours}h de vacation`,
          type: 'booking_request',
          related_booking_id: data.id
        });

      toast({
        title: "Demande envoyée",
        description: `Votre demande pour ${totalHours}h de vacation a été envoyée au médecin`,
      });

      onSuccess();
      onClose();
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
  const totalHours = selectedSlots.reduce((sum, slot) => sum + slot.hours, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demande de réservation</DialogTitle>
          <DialogDescription>
            Sélectionnez les créneaux souhaités pour cette vacation
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
                    Du {format(parseISO(vacation.start_date), 'dd MMMM yyyy', { locale: fr })} au {format(parseISO(vacation.end_date), 'dd MMMM yyyy', { locale: fr })}
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

          {/* Sélection des créneaux */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Créneaux disponibles</h4>
            
            {timeSlots.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-3 text-amber-600">
                  <AlertCircle className="w-8 h-8" />
                  <div>
                    <h4 className="font-medium mb-1">Créneaux non définis</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Le médecin n'a pas encore défini de créneaux horaires pour cette vacation.
                    </p>
                    <p className="text-xs text-gray-500">
                      Vous pouvez contacter le médecin directement pour connaître ses disponibilités ou attendre qu'il mette à jour sa vacation.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableDates.map(date => (
                  <Card key={date} className="p-4">
                    <h5 className="font-medium mb-3">
                      {format(parseISO(date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {timeSlots.map(slot => (
                        <div key={`${date}-${slot.id}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${date}-${slot.id}`}
                            checked={isSlotSelected(date, slot.id)}
                            onCheckedChange={(checked) => handleSlotSelection(date, slot, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`${date}-${slot.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <span>{formatTimeSlot(slot)}</span>
                              <span className="text-sm text-gray-500">
                                {calculateSlotHours(slot)}h - {calculateSlotHours(slot) * vacation.hourly_rate}€
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Résumé de la sélection */}
          {selectedSlots.length > 0 && (
            <div className="border border-medical-green/20 bg-medical-green/5 p-4 rounded-lg">
              <h4 className="font-semibold text-medical-green mb-3">Résumé de votre sélection</h4>
              <div className="space-y-2">
                {selectedSlots.map((slot, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {format(parseISO(slot.date), 'dd/MM', { locale: fr })} - {formatTimeSlot(slot.timeSlot)}
                    </span>
                    <span>{slot.hours}h - {slot.hours * vacation.hourly_rate}€</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total: {totalHours}h</span>
                  <span>{totalAmount}€</span>
                </div>
              </div>
            </div>
          )}

          {/* Message personnel */}
          <div className="space-y-2">
            <Label htmlFor="message">Message pour le médecin (optionnel)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez votre établissement, précisez vos besoins spécifiques..."
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
            disabled={loading || selectedSlots.length === 0}
            className="bg-medical-green hover:bg-medical-green-dark"
          >
            {loading ? 'Envoi en cours...' : `Envoyer la demande (${totalHours}h - ${totalAmount}€)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestModal;
