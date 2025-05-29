
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EstablishmentQuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => navigate('/vacation-search')} 
          className="w-full"
        >
          <Search className="w-4 h-4 mr-2" />
          Rechercher des vacations
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/my-bookings')}
          className="w-full"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Mes réservations
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/establishment-search')}
          className="w-full"
        >
          <Users className="w-4 h-4 mr-2" />
          Rechercher des médecins
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstablishmentQuickActions;
