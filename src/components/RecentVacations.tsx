
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Euro, Clock } from 'lucide-react';
import { VacationPost } from '@/types/database';

interface RecentVacationsProps {
  vacations: VacationPost[];
  title: string;
  emptyMessage: string;
  onViewAll?: () => void;
  showActions?: boolean;
  onActionClick?: (vacation: VacationPost) => void;
  actionLabel?: string;
}

const RecentVacations = ({ 
  vacations, 
  title, 
  emptyMessage, 
  onViewAll,
  showActions = false,
  onActionClick,
  actionLabel = "Voir"
}: RecentVacationsProps) => {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {vacations.length} vacation{vacations.length > 1 ? 's' : ''}
          </CardDescription>
        </div>
        {onViewAll && vacations.length > 0 && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            Voir tout
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {vacations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vacations.slice(0, 3).map((vacation) => (
              <div key={vacation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium truncate">{vacation.title}</h4>
                    <Badge className={getStatusColor(vacation.status)}>
                      {getStatusText(vacation.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(vacation.start_date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center">
                      <Euro className="w-3 h-3 mr-1" />
                      {vacation.hourly_rate}€/h
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {vacation.speciality}
                      </Badge>
                    </div>
                    {vacation.location && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{vacation.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {showActions && onActionClick && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onActionClick(vacation)}
                    className="ml-3"
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentVacations;
