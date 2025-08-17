import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock, MessageCircle } from 'lucide-react';
import { getSpecialityInfo } from '@/utils/specialities';
import { VacationWithDoctor } from '@/hooks/useEstablishmentSearch';
import { TimeSlot } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DoctorProfileModal } from './DoctorProfileModal';
import { logger } from "@/services/logger";

interface EstablishmentVacationCardProps {
  vacation: VacationWithDoctor;
  onBookingRequest: () => void;
}

export const EstablishmentVacationCard = ({ vacation, onBookingRequest }: EstablishmentVacationCardProps) => {
  const specialityInfo = getSpecialityInfo(vacation.speciality || '');
  const { user } = useAuth();
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);

  logger.info('Vacation data:', vacation);
  logger.info('Doctor info:', vacation.doctor_info);

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return '';
    
    const slots = timeSlots.map(slot => {
      switch (slot.type) {
        case 'morning':
          return 'Matin';
        case 'afternoon':
          return 'Après-midi';
        case 'custom':
          return `${slot.start_time} - ${slot.end_time}`;
        default:
          return '';
      }
    }).filter(Boolean);

    return slots.join(', ');
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {vacation.doctor && (
                <div 
                  className="mb-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setShowDoctorProfile(true)}
                >
                  <Avatar className="h-12 w-12 border-2 border-medical-blue">
                    <AvatarImage src={vacation.doctor.avatar_url} />
                    <AvatarFallback className="text-sm">
                      {vacation.doctor.first_name?.[0] || ''}{vacation.doctor.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">
                      Dr. {vacation.doctor.first_name || ''} {vacation.doctor.last_name || ''}
                    </div>
                    {vacation.doctor.experience_years && (
                      <div className="text-sm text-gray-600">
                        {vacation.doctor.experience_years} années d'expérience
                      </div>
                    )}
                  </div>
                </div>
              )}
              <CardTitle className="text-lg font-semibold">{vacation.title}</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                {vacation.description}
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 items-end">
              <Badge className={specialityInfo.color}>
                {specialityInfo.label}
              </Badge>
              {vacation.time_slots && vacation.time_slots.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {formatTimeSlots(vacation.time_slots)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
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
              {vacation.speciality && (
                <div className="flex items-center text-sm">
                  <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue">
                    {specialityInfo?.label || vacation.speciality}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span>
                  {vacation.doctor_info?.experience_years ? 
                    `${vacation.doctor_info.experience_years} années d'expérience` : 
                    'Expérience non spécifiée'
                  }
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span>
                  {Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                </span>
              </div>
            </div>
          </div>

          {vacation.description && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 text-sm">{vacation.description}</p>
            </div>
          )}

          {vacation.requirements && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Exigences</h4>
              <p className="text-gray-600 text-sm">{vacation.requirements}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Publié le {new Date(vacation.created_at).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onBookingRequest}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Réserver
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!user) return;
                  try {
                    const { error } = await supabase
                      .from('vacation_bookings')
                      .insert({
                        vacation_post_id: vacation.id,
                        doctor_id: vacation.doctor_id,
                        establishment_id: user.id,
                        status: 'pending',
                        payment_status: 'pending',
                        message: 'Réservation de test',
                        total_amount: vacation.hourly_rate * 8 * 7, // 8 heures par jour pendant 7 jours
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                    if (error) throw error;
                    toast({
                      title: "Réservation de test créée !",
                      description: "Une réservation de test a été créée avec succès.",
                    });
                  } catch (error: any) {
                    logger.error('Error creating test booking:', error);
                    toast({
                      title: "Erreur",
                      description: error.message || "Une erreur est survenue",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Créer une réservation de test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {vacation.doctor_info && (
        <DoctorProfileModal
          isOpen={showDoctorProfile}
          onClose={() => setShowDoctorProfile(false)}
          doctor={vacation.doctor_info}
        />
      )}
    </>
  );
};
