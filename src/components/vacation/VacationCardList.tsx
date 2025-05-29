
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Clock, Search } from 'lucide-react';
import { getSpecialityInfo } from '@/utils/specialities';

interface VacationPost {
  id: string;
  title: string;
  description: string;
  speciality: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location: string;
  requirements: string;
  doctor_id: string;
  created_at: string;
  doctor_profiles?: {
    bio: string;
    experience_years: number;
    license_number: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface VacationCardListProps {
  vacations: VacationPost[];
  onBookVacation: (vacationId: string) => void;
}

export const VacationCardList = ({ vacations, onBookVacation }: VacationCardListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
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

  if (vacations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune vacation trouvée
          </h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {vacations.map((vacation) => {
        const specialityInfo = getSpecialityInfo(vacation.speciality);
        const doctorName = vacation.profiles 
          ? `Dr. ${vacation.profiles.first_name} ${vacation.profiles.last_name}`
          : 'Médecin';

        return (
          <Card key={vacation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold mb-2">
                    {vacation.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mb-2">
                    {vacation.description}
                  </CardDescription>
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Médecin :</strong> {doctorName}
                  </div>
                </div>
                <Badge className={specialityInfo.color}>
                  {specialityInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{calculateDuration(vacation.start_date, vacation.end_date)} jour(s)</span>
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
                    <strong>Exigences :</strong> {vacation.requirements}
                  </p>
                </div>
              )}

              {vacation.doctor_profiles && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Expérience :</strong> {vacation.doctor_profiles.experience_years || 'Non renseignée'} années
                  </p>
                  {vacation.doctor_profiles.bio && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Bio :</strong> {vacation.doctor_profiles.bio}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={() => onBookVacation(vacation.id)}
                  className="bg-medical-green hover:bg-medical-green-dark"
                >
                  Réserver cette vacation
                </Button>
                <Button variant="outline">
                  Contacter le médecin
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
