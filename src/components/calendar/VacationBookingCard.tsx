import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VacationBooking, TimeSlot } from '@/types/calendar';
import { getVacationStatusColor, getVacationStatusLabel } from '@/utils/calendarUtils';

interface VacationBookingCardProps {
  vacation: VacationBooking;
}

const VacationBookingCard = ({ vacation }: VacationBookingCardProps) => {
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
    <div className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getVacationStatusColor(vacation.status)}`} />
            <h4 className="font-medium">{vacation.vacation_posts.title}</h4>
            <Badge variant="outline" className="text-xs">
              {getVacationStatusLabel(vacation.status)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(vacation.vacation_posts.start_date), 'dd/MM')} - {format(parseISO(vacation.vacation_posts.end_date), 'dd/MM')}
              </span>
            </div>
            {vacation.vacation_posts.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{vacation.vacation_posts.location}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-700">
            <p><strong>Établissement:</strong> {vacation.establishment_profiles.name}</p>
            {vacation.vacation_posts.speciality && (
              <p><strong>Spécialité:</strong> {vacation.vacation_posts.speciality}</p>
            )}
            {vacation.vacation_posts.time_slots && vacation.vacation_posts.time_slots.length > 0 && (
              <p><strong>Horaires:</strong> {formatTimeSlots(vacation.vacation_posts.time_slots)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationBookingCard;
