
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Euro, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecentBookings } from '@/hooks/useRecentBookings';

const EstablishmentRecentBookings = () => {
  const navigate = useNavigate();
  const { bookings, loading } = useRecentBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Réservations récentes</CardTitle>
          <p className="text-sm text-gray-600">
            {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
          </p>
        </div>
        {bookings.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => navigate('/my-bookings')}>
            Voir tout
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune réservation récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium truncate">{booking.vacation_post?.title}</h4>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(booking.vacation_post?.start_date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center">
                      <Euro className="w-3 h-3 mr-1" />
                      {booking.total_amount}€
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {booking.vacation_post?.speciality}
                      </Badge>
                    </div>
                    {booking.vacation_post?.location && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{booking.vacation_post?.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EstablishmentRecentBookings;
