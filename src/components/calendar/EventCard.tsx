
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { getEventTypeColor, getEventTypeLabel } from '@/utils/calendarUtils';

interface EventCardProps {
  event: CalendarEvent;
  readonly?: boolean;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

const EventCard = ({ event, readonly = false, onEdit, onDelete }: EventCardProps) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`} />
            <h4 className="font-medium">{event.title}</h4>
            <Badge variant="outline" className="text-xs">
              {getEventTypeLabel(event.event_type)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
              </span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-gray-700">{event.description}</p>
          )}
        </div>

        {!readonly && onEdit && onDelete && (
          <div className="flex space-x-1 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(event)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
