
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock } from 'lucide-react';
import { getSpecialityInfo } from '@/utils/specialities';
import { VacationWithDoctor } from '@/hooks/useEstablishmentSearch';

interface EstablishmentVacationCardProps {
  vacation: VacationWithDoctor;
  onBookingRequest: () => void;
}

export const EstablishmentVacationCard = ({ vacation, onBookingRequest }: EstablishmentVacationCardProps) => {
  const specialityInfo = getSpecialityInfo(vacation.speciality || '');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{vacation.title}</CardTitle>
            <CardDescription className="text-base">
              Dr. {vacation.doctor_info?.first_name} {vacation.doctor_info?.last_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-medical-green">
              {vacation.hourly_rate}€/h
            </div>
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
          <Button 
            onClick={onBookingRequest}
            className="bg-medical-green hover:bg-medical-green-dark"
          >
            Faire une demande
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
