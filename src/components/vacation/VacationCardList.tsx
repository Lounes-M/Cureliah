import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Clock, Search } from 'lucide-react';
import { getSpecialityInfo } from '@/utils/specialities';
import { TimeSlot, VacationPost } from '@/types/database';

interface VacationCardListProps {
  vacations: VacationPost[];
  onBookVacation: (vacationId: string) => void;
}

export const VacationCardList = ({ vacations, onBookVacation }: VacationCardListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return 'Non spécifié';
    
    return timeSlots.map(slot => {
      if (slot.type === 'custom' && slot.start_time && slot.end_time) {
        return `${slot.start_time} - ${slot.end_time}`;
      }
      return slot.type === 'morning' ? 'Matin' : 'Après-midi';
    }).join(', ');
  };

  if (vacations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune vacation trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vacations.map((vacation) => (
        <Card key={vacation.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">{vacation.title}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getSpecialityInfo(vacation.speciality)?.label || vacation.speciality}
                </Badge>
                <Badge variant="outline">
                  {calculateDuration(vacation.start_date, vacation.end_date)} jours
                </Badge>
              </div>

              {vacation.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{vacation.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Euro className="w-4 h-4" />
                <span>{vacation.hourly_rate}€/heure</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTimeSlots(vacation.time_slots)}</span>
              </div>

              <Button 
                className="w-full"
                onClick={() => onBookVacation(vacation.id)}
              >
                Réserver
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
