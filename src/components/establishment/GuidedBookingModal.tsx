import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Euro,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  FileText,
  Shield,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface VacationWithDoctor {
  id: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  act_type: string;
  status: string;
  description: string;
  requirements: string;
  doctor_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    speciality: string;
    avatar_url?: string;
    experience_years?: number;
    average_rating?: number;
    total_reviews?: number;
  };
}

interface GuidedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacation: VacationWithDoctor | null;
  onSuccess: () => void;
}

interface BookingData {
  preferred_start_time: string;
  duration_hours: number;
  urgency: 'low' | 'medium' | 'high';
  contact_phone: string;
  contact_email: string;
  message: string;
  special_requirements: string;
  establishment_details: string;
}

const STEPS = [
  { id: 1, title: 'Détails vacation', description: 'Informations sur l\'intervention' },
  { id: 2, title: 'Planification', description: 'Date et horaires' },
  { id: 3, title: 'Contact', description: 'Vos coordonnées' },
  { id: 4, title: 'Message', description: 'Détails spécifiques' },
  { id: 5, title: 'Confirmation', description: 'Vérification finale' }
];

export const GuidedBookingModal: React.FC<GuidedBookingModalProps> = ({
  isOpen,
  onClose,
  vacation,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [bookingData, setBookingData] = useState<BookingData>({
    preferred_start_time: '',
    duration_hours: 1,
    urgency: 'medium',
    contact_phone: '',
    contact_email: '',
    message: '',
    special_requirements: '',
    establishment_details: ''
  });

  // Initialiser les données par défaut
  useEffect(() => {
    if (vacation && isOpen) {
      setBookingData(prev => ({
        ...prev,
        preferred_start_time: vacation.start_date.split('T')[0] + 'T08:00',
        contact_email: user?.email || ''
      }));
    }
  }, [vacation, isOpen, user]);

  const resetModal = () => {
    setCurrentStep(1);
    setErrors({});
    setBookingData({
      preferred_start_time: '',
      duration_hours: 1,
      urgency: 'medium',
      contact_phone: '',
      contact_email: user?.email || '',
      message: '',
      special_requirements: '',
      establishment_details: ''
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 2:
        if (!bookingData.preferred_start_time) {
          newErrors.preferred_start_time = 'Veuillez sélectionner une date et heure';
        }
        if (bookingData.duration_hours < 0.5 || bookingData.duration_hours > 24) {
          newErrors.duration_hours = 'La durée doit être entre 0.5 et 24 heures';
        }
        break;
        
      case 3:
        if (!bookingData.contact_phone) {
          newErrors.contact_phone = 'Numéro de téléphone requis';
        }
        if (!bookingData.contact_email) {
          newErrors.contact_email = 'Email requis';
        }
        if (!bookingData.establishment_details) {
          newErrors.establishment_details = 'Détails sur votre établissement requis';
        }
        break;
        
      case 4:
        if (!bookingData.message.trim()) {
          newErrors.message = 'Veuillez décrire vos besoins';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitBooking = async () => {
    if (!vacation || !user || !validateStep(4)) return;

    setLoading(true);
    try {
      // Vérifier s'il existe déjà une demande
      const { data: existingBooking } = await supabase
        .from('vacation_bookings')
        .select('id')
        .eq('vacation_post_id', vacation.id)
        .eq('establishment_id', user.id)
        .single();

      if (existingBooking) {
        toast({
          title: "Demande déjà envoyée",
          description: "Vous avez déjà fait une demande pour cette vacation",
          variant: "destructive",
        });
        return;
      }

      const estimatedAmount = vacation.hourly_rate * bookingData.duration_hours;

      const { error } = await supabase
        .from('vacation_bookings')
        .insert([{
          vacation_post_id: vacation.id,
          establishment_id: user.id,
          doctor_id: vacation.doctor_profiles.id,
          status: 'pending',
          message: bookingData.message,
          total_amount: estimatedAmount,
          preferred_start_time: bookingData.preferred_start_time,
          duration_hours: bookingData.duration_hours,
          urgency: bookingData.urgency,
          contact_phone: bookingData.contact_phone,
          contact_email: bookingData.contact_email,
          special_requirements: bookingData.special_requirements,
          establishment_details: bookingData.establishment_details
        }]);

      if (error) throw error;

      toast({
        title: "Demande envoyée avec succès",
        description: "Le médecin recevra votre demande et vous contactera rapidement",
      });

      onSuccess();
      onClose();
      resetModal();

    } catch (error) {
      logger.error('Error submitting booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Urgent';
      case 'medium': return 'Normal';
      case 'low': return 'Flexible';
      default: return urgency;
    }
  };

  if (!vacation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Demande de réservation - Étape {currentStep}/5
          </DialogTitle>
        </DialogHeader>

        {/* Barre de progression */}
        <div className="mb-6">
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-xs ${
                  step.id <= currentStep ? 'text-medical-blue' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.id <= currentStep
                      ? 'bg-medical-blue text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="font-medium">{step.title}</span>
                <span className="text-gray-500">{step.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="space-y-6">
          {/* Étape 1: Détails vacation */}
          {currentStep === 1 && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={vacation.doctor_profiles.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                      {vacation.doctor_profiles.first_name?.[0]}
                      {vacation.doctor_profiles.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {vacation.title}
                    </h3>
                    <p className="text-blue-700 font-semibold mb-1">
                      Dr {vacation.doctor_profiles.first_name} {vacation.doctor_profiles.last_name}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {vacation.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(vacation.start_date)}
                      </div>
                      {vacation.doctor_profiles.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{vacation.doctor_profiles.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-medical-green">
                        {vacation.hourly_rate}€/h
                      </div>
                    </div>
                  </div>
                </div>

                {vacation.description && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-medium mb-2">Description de l'intervention</h4>
                    <p className="text-gray-700 text-sm">{vacation.description}</p>
                  </div>
                )}

                {vacation.requirements && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Exigences particulières
                    </h4>
                    <p className="text-orange-800 text-sm">{vacation.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Planification */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_start_time">Date et heure préférées *</Label>
                  <Input
                    id="preferred_start_time"
                    type="datetime-local"
                    value={bookingData.preferred_start_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, preferred_start_time: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`mt-1 ${errors.preferred_start_time ? 'border-red-500' : ''}`}
                  />
                  {errors.preferred_start_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferred_start_time}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration_hours">Durée estimée (heures) *</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={bookingData.duration_hours}
                    onChange={(e) => setBookingData(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) }))}
                    className={`mt-1 ${errors.duration_hours ? 'border-red-500' : ''}`}
                  />
                  {errors.duration_hours && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration_hours}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="urgency">Niveau d'urgence</Label>
                <Select value={bookingData.urgency} onValueChange={(value: any) => setBookingData(prev => ({ ...prev, urgency: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Flexible - Pas urgent</SelectItem>
                    <SelectItem value="medium">🟡 Normal - Dans les prochains jours</SelectItem>
                    <SelectItem value="high">🔴 Urgent - Dès que possible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimation du coût */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">Estimation du coût</h4>
                      <p className="text-sm text-medical-green">
                        {vacation.hourly_rate}€/h × {bookingData.duration_hours}h
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {(vacation.hourly_rate * bookingData.duration_hours).toFixed(2)}€
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Étape 3: Contact */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Téléphone de contact *</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={bookingData.contact_phone}
                    onChange={(e) => setBookingData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    className={`mt-1 ${errors.contact_phone ? 'border-red-500' : ''}`}
                  />
                  {errors.contact_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact_email">Email de contact *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={bookingData.contact_email}
                    onChange={(e) => setBookingData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="contact@etablissement.fr"
                    className={`mt-1 ${errors.contact_email ? 'border-red-500' : ''}`}
                  />
                  {errors.contact_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="establishment_details">Détails sur votre établissement *</Label>
                <Textarea
                  id="establishment_details"
                  value={bookingData.establishment_details}
                  onChange={(e) => setBookingData(prev => ({ ...prev, establishment_details: e.target.value }))}
                  placeholder="Nom de l'établissement, type (hôpital, clinique, cabinet...), spécialités..."
                  rows={3}
                  className={`mt-1 ${errors.establishment_details ? 'border-red-500' : ''}`}
                />
                {errors.establishment_details && (
                  <p className="text-red-500 text-sm mt-1">{errors.establishment_details}</p>
                )}
              </div>
            </div>
          )}

          {/* Étape 4: Message */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message pour le médecin *</Label>
                <Textarea
                  id="message"
                  value={bookingData.message}
                  onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Décrivez le contexte de l'intervention, vos besoins spécifiques, les équipements disponibles..."
                  rows={4}
                  className={`mt-1 ${errors.message ? 'border-red-500' : ''}`}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="special_requirements">Besoins particuliers (optionnel)</Label>
                <Textarea
                  id="special_requirements"
                  value={bookingData.special_requirements}
                  onChange={(e) => setBookingData(prev => ({ ...prev, special_requirements: e.target.value }))}
                  placeholder="Équipements spéciaux, contraintes d'accès, autres informations importantes..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Étape 5: Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-medical-green" />
                    Récapitulatif de votre demande
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Intervention</h4>
                      <p><strong>Vacation:</strong> {vacation.title}</p>
                      <p><strong>Médecin:</strong> Dr {vacation.doctor_profiles.first_name} {vacation.doctor_profiles.last_name}</p>
                      <p><strong>Lieu:</strong> {vacation.location}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Planification</h4>
                      <p><strong>Date:</strong> {formatDate(bookingData.preferred_start_time)}</p>
                      <p><strong>Heure:</strong> {formatTime(bookingData.preferred_start_time)}</p>
                      <p><strong>Durée:</strong> {bookingData.duration_hours}h</p>
                      <p>
                        <strong>Urgence:</strong> 
                        <Badge className={`ml-2 ${getUrgencyColor(bookingData.urgency)}`}>
                          {getUrgencyLabel(bookingData.urgency)}
                        </Badge>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Contact</h4>
                      <p><strong>Téléphone:</strong> {bookingData.contact_phone}</p>
                      <p><strong>Email:</strong> {bookingData.contact_email}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Coût estimé</h4>
                      <p className="text-2xl font-bold text-medical-green">
                        {(vacation.hourly_rate * bookingData.duration_hours).toFixed(2)}€
                      </p>
                    </div>
                  </div>

                  {bookingData.message && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Votre message</h4>
                      <p className="text-gray-700 bg-white p-3 rounded border italic">
                        "{bookingData.message}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-semibold text-orange-800 mb-1">Important</h4>
                      <p className="text-orange-700">
                        Cette demande sera envoyée au médecin qui vous contactera pour confirmer les détails. 
                        Le paiement se fera après accord mutuel.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : prevStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2 bg-medical-blue hover:bg-medical-blue-dark"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={submitBooking}
              disabled={loading}
              className="flex items-center gap-2 bg-medical-green hover:bg-medical-green-dark"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer la demande
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
