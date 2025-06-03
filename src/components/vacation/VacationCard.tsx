import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { VacationPost } from '@/services/vacationService';

interface VacationCardProps {
  vacation: VacationPost;
  onBook?: (vacation: VacationPost) => void;
}

export const VacationCard = ({ vacation, onBook }: VacationCardProps) => {
  const {
    doctor,
    establishment,
    start_date,
    end_date,
    hourly_rate,
    description,
    status
  } = vacation;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.profile_picture_url} />
            <AvatarFallback>
              {doctor.first_name[0]}
              {doctor.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              Dr. {doctor.first_name} {doctor.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{doctor.speciality}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{establishment.city}, {establishment.country}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(start_date), 'MMM d, yyyy')} -{' '}
              {format(new Date(end_date), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Euro className="h-4 w-4" />
            <span>{hourly_rate}€/hour</span>
          </div>

          {doctor.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">{doctor.rating.toFixed(1)}</span>
            </div>
          )}

          <p className="text-sm line-clamp-3">{description}</p>

          <div className="flex items-center justify-between">
            <Badge variant={status === 'available' ? 'default' : 'secondary'}>
              {status}
            </Badge>
            {status === 'available' && onBook && (
              <Button onClick={() => onBook(vacation)}>Book Now</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 