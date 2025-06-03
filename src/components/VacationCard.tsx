import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Euro, Clock, User, Eye, Pencil } from 'lucide-react';
import { VacationPost, TimeSlot } from '@/types/database';
import { getSpecialityInfo } from '@/utils/specialities';

interface VacationCardProps {
  vacation: VacationPost;
  onBook?: (vacationId: string) => void;
  onEdit?: (vacationId: string) => void;
  onView?: (vacationId: string) => void;
  showActions?: boolean;
  isEstablishment?: boolean;
}

const VacationCard = ({ 
  vacation, 
  onBook, 
  onEdit, 
  onView, 
  showActions = true,
  isEstablishment = false 
}: VacationCardProps) => {
  const specialityInfo = getSpecialityInfo(vacation.speciality);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'booked': return 'Réservé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = () => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return 'Non spécifié';
    
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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{vacation.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              {vacation.description}
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-2 items-end">
            <Badge className={getStatusColor(vacation.status)}>
              {getStatusText(vacation.status)}
            </Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Du {new Date(vacation.start_date).toLocaleDateString()} au {new Date(vacation.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                {vacation.time_slots && vacation.time_slots.length > 0 ? (
                  vacation.time_slots.map((slot, index) => (
                    <span key={index}>
                      {slot.type === 'morning' ? 'Matin' :
                       slot.type === 'afternoon' ? 'Après-midi' :
                       `${slot.start_time} - ${slot.end_time}`}
                      {index < vacation.time_slots.length - 1 ? ', ' : ''}
                    </span>
                  ))
                ) : (
                  'Non spécifié'
                )}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Euro className="w-4 h-4 mr-2" />
              <span className="font-medium">{vacation.hourly_rate}€/heure</span>
            </div>
            {vacation.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{vacation.location}</span>
              </div>
            )}
          </div>
        </div>

        {vacation.requirements && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Exigences:</strong> {vacation.requirements}
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex justify-end space-x-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(vacation.id)}>
                <Eye className="w-4 h-4 mr-2" />
                Voir
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(vacation.id)}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
            {onBook && (
              <Button size="sm" onClick={() => onBook(vacation.id)}>
                Réserver
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VacationCard;
