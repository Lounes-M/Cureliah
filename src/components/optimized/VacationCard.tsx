import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Euro, Star, Eye } from 'lucide-react';

interface VacationCardProps {
  vacation: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
  // ...le champ price est supprimé pour les médecins
    rating?: number;
    reviews_count?: number;
    image_url?: string;
    status: 'available' | 'booked' | 'pending';
  };
  onView?: (id: string) => void;
  onBook?: (id: string) => void;
  loading?: boolean;
}

const VacationCardSkeleton = memo(() => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-20" />
      </div>
    </CardContent>
  </Card>
));

VacationCardSkeleton.displayName = 'VacationCardSkeleton';

const VacationCard = memo(({ vacation, onView, onBook, loading = false }: VacationCardProps) => {
  // ...la logique d'affichage du prix est supprimée pour les médecins

  const formatDate = useCallback((date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(date));
  }, []);

  const handleView = useCallback(() => {
    onView?.(vacation.id);
  }, [onView, vacation.id]);

  const handleBook = useCallback(() => {
    onBook?.(vacation.id);
  }, [onBook, vacation.id]);

  const statusConfig = useMemo(() => {
    const configs = {
      available: { color: 'bg-green-100 text-green-800', text: 'Disponible' },
      booked: { color: 'bg-gray-100 text-gray-800', text: 'Réservé' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' }
    };
    return configs[vacation.status] || configs.available;
  }, [vacation.status]);

  if (loading) {
    return <VacationCardSkeleton />;
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <div className="relative">
        <img
          src={vacation.image_url || '/placeholder.svg'}
          alt={vacation.title}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <Badge className={`absolute top-2 right-2 ${statusConfig.color}`}>
          {statusConfig.text}
        </Badge>
        {vacation.rating && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center space-x-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{vacation.rating}</span>
            {vacation.reviews_count && (
              <span className="text-xs">({vacation.reviews_count})</span>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">{vacation.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vacation.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{vacation.location}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center">
            <Euro className="h-4 w-4 text-medical-green mr-1" />
            {/* Prix supprimé pour conformité réglementaire */}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Voir
            </Button>
            {vacation.status === 'available' && (
              <Button
                size="sm"
                onClick={handleBook}
                className="h-8"
              >
                Réserver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VacationCard.displayName = 'VacationCard';

export default VacationCard;
export { VacationCardSkeleton };
